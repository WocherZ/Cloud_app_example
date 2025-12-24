from typing import Optional, Iterable, Literal
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..config import settings

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - защита от отсутствующей зависимости
    OpenAI = None  # type: ignore


router = APIRouter(prefix="/generation", tags=["Генерация текстов"])

SYSTEM_PROMPT = (
    "Ты — опытный редактор пресс-службы Росатома. Пиши на русском, выдерживая "
    "деловой, при этом вдохновляющий тон. Текст должен быть чётким, с акцентом "
    "на социальную значимость инициатив и конкретные результаты."
)


def _load_portal_instructions() -> str:
    """
    Загружает текстовое описание портала из файла instructions.txt,
    чтобы использовать его как контекст для генерации ответов.
    """
    instructions_path = Path(__file__).with_name("instructions.txt")
    try:
        return instructions_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        # Если файла нет — просто работаем без дополнительного контекста.
        return ""
    except OSError:
        return ""


INSTRUCTIONS_TEXT = _load_portal_instructions()


class NewsGenerationRequest(BaseModel):
    title: str = Field(
        ...,
        min_length=5,
        max_length=200,
        description="Заголовок или тема новости, по которой нужно подготовить текст",
    )


class NewsGenerationResponse(BaseModel):
    title: str
    content: str


class DialogueGenerationRequest(BaseModel):
    dialogue: str = Field(
        ...,
        min_length=10,
        max_length=4000,
        description=(
            "Диалог с пользователем (включая реплики ассистента), который нужно продолжить."
        ),
    )


class DialogueGenerationResponse(BaseModel):
    answer: str


class NewsEditRequest(BaseModel):
    news_text: str = Field(
        ...,
        min_length=10,
        max_length=10000,
        description="Текст новости, которую нужно отредактировать",
    )
    user_request: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Запрос пользователя с дополнительными требованиями к редактированию",
    )
    action: Literal["Длиннее", "короче"] = Field(
        ...,
        description="Действие: сделать текст длиннее или короче",
    )


class NewsEditResponse(BaseModel):
    content: str


_openai_client: Optional["OpenAI"] = None


def _get_openai_client() -> "OpenAI":
    if OpenAI is None:
        raise HTTPException(
            status_code=500,
            detail="Библиотека для работы с OpenAI не установлена на сервере.",
        )

    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API ключ не настроен. Установите переменную окружения OPENAI_API_KEY.",
        )

    global _openai_client
    if _openai_client is None:
        try:
            client_kwargs = {"api_key": api_key}
            if settings.OPENAI_BASE_URL:
                client_kwargs["base_url"] = settings.OPENAI_BASE_URL
            _openai_client = OpenAI(**client_kwargs)
        except Exception as exc:  # pragma: no cover - сетевые ошибки
            raise HTTPException(
                status_code=500,
                detail="Не удалось инициализировать OpenAI клиент.",
            ) from exc
    return _openai_client


def _build_prompt(title: str) -> str:
    return (
        "Подготовь развернутое содержание новости объёмом 2–3 абзаца (примерно "
        "800–1200 знаков) на тему: «{title}». Уточни:\n"
        "• в чём заключается инициатива и кто её реализует;\n"
        "• какую пользу она приносит жителям или НКО;\n"
        "• что запланировано дальше.\n"
        "Избегай повторов, используй живые факты и конкретику, но ничего не "
        "выдумывай, если данных нет — делай аккуратные формулировки. Заверши "
        "текст лёгким призывом к участию или вниманию к проекту."
    ).format(title=title.strip())


def _build_dialogue_prompt(dialogue: str) -> list[dict[str, str]]:
    user_prompt = (
        "Ниже приведён диалог пользователя с ассистентом. Ответь на последнюю "
        "реплику пользователя на русском языке. Дай полезный, фактический и короткий "
        "ответ (не более 5–7 предложений), укажи конкретные шаги или рекомендации, если это уместно. "
        "Если данных недостаточно, честно скажи об этом и предложи, что можно уточнить."
    )

    # Дополнительный контекст о портале, загруженный из instructions.txt
    portal_context = ""
    if INSTRUCTIONS_TEXT:
        portal_context = (
            "Дополнительный контекст о портале «Добрые дела Росатома»:\n"
            f"{INSTRUCTIONS_TEXT}\n\n"
            "Используй эту информацию как справку при ответах пользователю, "
            "но не цитируй её полностью дословно без необходимости."
        )

    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
            + ("\n\n" + portal_context if portal_context else ""),
        },
        {"role": "user", "content": user_prompt},
        {"role": "assistant", "content": dialogue.strip()},
    ]


def _build_news_edit_prompt(news_text: str, user_request: str, action: str) -> str:
    action_instruction = (
        "сделай текст длиннее, расширь его, добавь больше деталей и контекста"
        if action == "Длиннее"
        else "сделай текст короче, сократи его, оставь только самое важное"
    )
    
    return (
        "Ниже приведён текст новости. {action_instruction}. "
        "Дополнительные требования пользователя: {user_request}\n\n"
        "Текст новости:\n{news_text}\n\n"
        "Верни только отредактированный текст новости, без дополнительных комментариев и пояснений."
    ).format(
        action_instruction=action_instruction,
        user_request=user_request.strip(),
        news_text=news_text.strip(),
    )


def _generate_news_body(title: str) -> str:
    client = _get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        temperature=settings.OPENAI_TEMPERATURE,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(title)},
        ],
    )

    try:
        content = response.choices[0].message.content or ""
    except (IndexError, AttributeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="LLM вернула неожиданную структуру ответа.",
        ) from exc

    content = content.strip()
    if not content:
        raise HTTPException(
            status_code=502,
            detail="LLM не смогла сгенерировать текст новости.",
        )

    return content


def _generate_dialogue_answer(dialogue: str) -> str:
    client = _get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        temperature=settings.OPENAI_TEMPERATURE,
        messages=_build_dialogue_prompt(dialogue),
    )

    try:
        content = response.choices[0].message.content or ""
    except (IndexError, AttributeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="LLM вернула неожиданную структуру ответа.",
        ) from exc

    content = content.strip()
    if not content:
        raise HTTPException(
            status_code=502,
            detail="LLM не смогла сгенерировать ответ.",
        )

    return content


def _edit_news(news_text: str, user_request: str, action: str) -> str:
    client = _get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        temperature=settings.OPENAI_TEMPERATURE,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_news_edit_prompt(news_text, user_request, action)},
        ],
    )

    try:
        content = response.choices[0].message.content or ""
    except (IndexError, AttributeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="LLM вернула неожиданную структуру ответа.",
        ) from exc

    content = content.strip()
    if not content:
        raise HTTPException(
            status_code=502,
            detail="LLM не смогла отредактировать текст новости.",
        )

    return content


def _stream_dialogue_answer(dialogue: str) -> Iterable[str]:
    """
    Стриминговая генерация ответа: по мере поступления токенов от LLM
    возвращаем их вызывающей стороне.
    """
    client = _get_openai_client()
    try:
        stream = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=settings.OPENAI_TEMPERATURE,
            messages=_build_dialogue_prompt(dialogue),
            stream=True,
        )
    except Exception as exc:  # pragma: no cover - сетевые ошибки
        raise HTTPException(
            status_code=502,
            detail="Ошибка при обращении к сервису генерации текста (stream).",
        ) from exc

    # Поток chunk'ов от модели. Каждый chunk может содержать небольшой фрагмент текста.
    for chunk in stream:
        try:
            delta = chunk.choices[0].delta.content or ""
        except (IndexError, AttributeError):
            # Пропускаем неожиданные chunk'и без текста
            continue
        if not delta:
            continue
        # Отдаём фрагмент текста как есть, без обёртки в SSE,
        # чтобы на фронтенде можно было просто читать текстовый поток.
        yield delta


@router.post(
    "/news",
    response_model=NewsGenerationResponse,
    summary="Сгенерировать содержание новости",
)
async def generate_news_description(payload: NewsGenerationRequest) -> NewsGenerationResponse:
    """
    Принимает заголовок новости и возвращает сгенерированное содержание.
    """
    try:
        content = await run_in_threadpool(_generate_news_body, payload.title)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - сетевые ошибки
        raise HTTPException(
            status_code=502,
            detail="Ошибка при обращении к сервису генерации текста.",
        ) from exc

    return NewsGenerationResponse(title=payload.title, content=content)


@router.post(
    "/dialogue",
    response_model=DialogueGenerationResponse,
    summary="Сгенерировать ответ на вопрос пользователя",
)
async def continue_dialogue(payload: DialogueGenerationRequest) -> DialogueGenerationResponse:
    """
    Принимает диалог в текстовом виде и возвращает ответ ассистента.
    """
    try:
        content = await run_in_threadpool(_generate_dialogue_answer, payload.dialogue)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - сетевые ошибки
        raise HTTPException(
            status_code=502,
            detail="Ошибка при обращении к сервису генерации текста.",
        ) from exc

    return DialogueGenerationResponse(answer=content)


@router.post(
    "/dialogue/stream",
    summary="Сгенерировать ответ на вопрос пользователя в потоковом режиме",
)
def continue_dialogue_stream(payload: DialogueGenerationRequest) -> StreamingResponse:
    """
    Стриминговая версия ассистента.

    Возвращает текстовый HTTP‑поток (chunked transfer), в котором содержимое ответа
    поступает по мере генерации LLM. Клиенту достаточно читать тело ответа как
    обычный текстовый поток.
    """

    def token_generator() -> Iterable[str]:
        yield from _stream_dialogue_answer(payload.dialogue)

    return StreamingResponse(
        token_generator(),
        media_type="text/plain; charset=utf-8",
    )


@router.post(
    "/news/edit",
    response_model=NewsEditResponse,
    summary="Отредактировать текст новости",
)
async def edit_news(payload: NewsEditRequest) -> NewsEditResponse:
    """
    Принимает текст новости, запрос пользователя и действие (Длиннее/короче),
    возвращает отредактированный текст новости.
    """
    try:
        content = await run_in_threadpool(
            _edit_news, payload.news_text, payload.user_request, payload.action
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - сетевые ошибки
        raise HTTPException(
            status_code=502,
            detail="Ошибка при обращении к сервису генерации текста.",
        ) from exc

    return NewsEditResponse(content=content)

