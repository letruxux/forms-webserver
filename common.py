from quart import Response
from aiohttp import ClientSession
from json import dumps as jsonify
import json
import random
import string
import time
import os
import rich

bad_request = Response(
    jsonify({"status": "Failed", "error": "Bad Request", "message": "Not specified."}),
    status=400,
    mimetype="application/json",
)
unauthorized = Response(
    jsonify(
        {
            "status": "Failed",
            "error": "Unauthorized",
            "message": "Not authenticated with discord. Access /login to login.",
        }
    ),
    status=401,
    mimetype="application/json",
)


def createFolders():
    if not os.path.exists(os.path.join(os.getcwd(), "data")):
        os.mkdir(os.path.join(os.getcwd(), "data"))

    if not os.path.exists(os.path.join(os.getcwd(), "data", "forms.json")):
        with open(
            os.path.join(os.getcwd(), "data", "forms.json"),
            "w",
            encoding="utf-8",
        ) as f:
            json.dump({"forms": {}}, f, indent=4)


def getNewId(length: int = 25):
    i = "".join([random.choice(string.ascii_letters) for _ in range(length)])
    if not loadForm(i):
        return i
    else:
        return getNewId(length)


def loadForm(form_id: str):
    with open("data/forms.json", "r", encoding="utf-8") as f:
        return json.load(f)["forms"].get(form_id)


def loadForms(user_id: int):
    with open("data/forms.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return [data for data in data["forms"].values() if data["creator_id"] == user_id]


def deleteForm(form_id: str, user_id: int):
    with open("data/forms.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    new_data = data
    forms = new_data["forms"]

    if form_id not in forms:
        return Response(
            jsonify(
                {
                    "status": "Failed",
                    "error": "Bad Request",
                    "message": "That form doesn't exist.",
                }
            ),
            status=400,
            mimetype="application/json",
        )

    form = forms[form_id]

    if form["creator_id"] != user_id:
        return Response(
            jsonify(
                {
                    "status": "Failed",
                    "error": "Forbidden",
                    "message": "That form is not yours.",
                }
            ),
            status=403,
            mimetype="application/json",
        )

    new_data["forms"].pop(form_id)

    with open("data/forms.json", "w", encoding="utf-8") as f:
        try:
            json.dump(new_data, f, indent=4)
            return Response(
                jsonify(
                    {
                        "status": "Success",
                        "message": "Form deleted successfully.",
                    }
                ),
                status=200,
                mimetype="application/json",
            )
        except:
            f.write(jsonify({"forms": {}}))
            json.dump(data, f, indent=4)
            return Response(
                jsonify(
                    {
                        "status": "Failed",
                        "error": "Internal Server Error",
                        "message": "Form deleting failed.",
                    }
                ),
                status=500,
                mimetype="application/json",
            )


def createForm(form_data: dict, creator):
    form_data["id"] = getNewId()
    form_data["creator_id"] = creator.id
    form_data["created_at"] = int(time.time())

    with open("data/forms.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    data["forms"][form_data["id"]] = form_data

    with open("data/forms.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    return form_data


async def check_discord_webhook(webhook_url):
    try:
        async with ClientSession() as session:
            async with session.get(webhook_url) as response:
                if response.status == 200:
                    # Webhook is valid, return True
                    return True
                else:
                    # Webhook is invalid, return False
                    return False
    except Exception:
        # An error occurred while checking the webhook, return False
        return False


async def validate_questions_and_webhook(questions, wh):
    if len(questions) > 25:
        return "You can't have more than 25 questions."

    if len(questions) < 1:
        return "You need at least one question."

    if not all(question.strip() for question in questions):
        return "Field(s) empty!"

    try:
        is_valid_webhook = await check_discord_webhook(wh)

        if not is_valid_webhook:
            return "Invalid webhook URL."

        # All checks passed, data is valid
        return True
    except Exception as error:
        return "Unknown error."
