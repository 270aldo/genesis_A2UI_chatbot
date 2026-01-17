from __future__ import annotations

import json
import os
from typing import Any

import google.auth
from google.auth.transport.requests import AuthorizedSession, Request

CLOUD_TASKS_PROJECT = os.getenv("CLOUD_TASKS_PROJECT", "")
CLOUD_TASKS_LOCATION = os.getenv("CLOUD_TASKS_LOCATION", "")
CLOUD_TASKS_QUEUE = os.getenv("CLOUD_TASKS_QUEUE", "")
CLOUD_TASKS_SERVICE_ACCOUNT = os.getenv("CLOUD_TASKS_SERVICE_ACCOUNT", "")


def is_tasks_configured() -> bool:
    return bool(CLOUD_TASKS_PROJECT and CLOUD_TASKS_LOCATION and CLOUD_TASKS_QUEUE)


def _queue_path() -> str:
    return f"projects/{CLOUD_TASKS_PROJECT}/locations/{CLOUD_TASKS_LOCATION}/queues/{CLOUD_TASKS_QUEUE}"


def enqueue_http_task(url: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    if not is_tasks_configured():
        raise RuntimeError("Cloud Tasks not configured")

    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-tasks"])
    session = AuthorizedSession(credentials)

    task: dict[str, Any] = {
        "httpRequest": {
            "httpMethod": "POST",
            "url": url,
            "headers": {
                "Content-Type": "application/json",
            },
        }
    }

    if payload is not None:
        task["httpRequest"]["body"] = json.dumps(payload).encode("utf-8")

    if CLOUD_TASKS_SERVICE_ACCOUNT:
        task["httpRequest"]["oidcToken"] = {
            "serviceAccountEmail": CLOUD_TASKS_SERVICE_ACCOUNT,
        }

    request = Request()
    credentials.refresh(request)

    response = session.post(
        f"https://cloudtasks.googleapis.com/v2/{_queue_path()}/tasks",
        json={"task": task},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
