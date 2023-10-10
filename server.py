from quart import Quart, redirect, url_for, render_template, Response, request
from quart_discord import DiscordOAuth2Session, Unauthorized
from discord import Embed, Color
from aiohttp import ClientSession, ClientResponseError
from config import *
from common import *
import json

app = Quart(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.secret_key = "hello"

app.config["DISCORD_CLIENT_ID"] = DISCORD_CLIENT_ID
app.config["DISCORD_CLIENT_SECRET"] = DISCORD_CLIENT_SECRET
app.config["DISCORD_REDIRECT_URI"] = DISCORD_REDIRECT_URI
app.config["DISCORD_BOT_TOKEN"] = DISCORD_BOT_TOKEN

discord = DiscordOAuth2Session(app)

createFolders()


@app.route("/")
async def main():
    root_url = request.root_url.removesuffix("/")
    to_return = ""
    for url in [".login", ".logout", ".create_new", ".view"]:
        path = url_for(url)
        full_url = root_url + path
        to_return += f'<a href="{full_url}">{path}</a><br>'
    return to_return


@app.route("/login")
async def login():
    return await discord.create_session()


@app.route("/callback")
async def callback():
    await discord.callback()
    return redirect(url_for(".create_new"))


@app.route("/logout")
async def logout():
    discord.revoke()
    return redirect(url_for(".main"))


@app.route("/create")
async def create_new():
    # redirect if not authorized
    if not await discord.authorized:
        return redirect(url_for(".login"))

    return await render_template("create.html")


@app.route("/view")
async def view():
    data = request.args

    # get form data
    form_data = loadForm(data.get("form", ""))
    if form_data is None:
        return bad_request

    # remove webhook url from form data
    edited_form_data = form_data
    edited_form_data.pop("webhook_url")

    # get user data
    user = await discord.fetch_user()
    user_data = {"avatar_url": user.avatar_url, "name": user.name, "id": user.id}

    return await render_template(
        "view.html",
        form_data=json.dumps(edited_form_data),
        user_data=json.dumps(user_data),
    )


@app.route("/forms")
async def user_forms():
    if not await discord.authorized:
        return redirect(url_for("login"))

    # Get the user's forms from the data
    user_id = (
        await discord.fetch_user()
    ).id  # Assuming user ID is used as the key in the data
    user_forms = loadForms(user_id)

    return await render_template("forms.html", forms=user_forms)


@app.route("/api/create", methods=["POST"])
async def api_create():
    if not await discord.authorized:
        return unauthorized
    data = await request.get_json()

    if (
        (data.get("form_name") is not None)
        and (data.get("questions") is not None)
        and (data.get("webhook_url") is not None)
    ):
        questions = [i.strip() for i in data["questions"]]
        wh = data.get("webhook_url")
        result = await validate_questions_and_webhook(questions, wh) == True
        if result == True:
            data["questions"] = questions
            form_data = createForm(data, await discord.fetch_user())
            return Response(
                json.dumps({"status": "Success", "form_id": form_data["id"]}),
                status=200,
                mimetype="application/json",
            )
        else:
            return Response(
                json.dumps(
                    {"status": "Failed", "error": "Bad Request", "message": result}
                ),
                status=400,
                mimetype="application/json",
            )
    return bad_request


@app.route("/api/delete", methods=["DELETE", "POST"])
async def api_delete():
    if not await discord.authorized:
        return unauthorized
    data = await request.get_json()
    print(data)
    if "form" in data:
        return deleteForm(data["form"], (await discord.fetch_user()).id)
    else:
        return bad_request


@app.route("/api/list", methods=["GET"])
async def api_list_forms():
    if not await discord.authorized:
        return unauthorized

    return loadForms((await discord.fetch_user()).id)


@app.route("/api/submit", methods=["POST"])
async def api_submit():
    data = await request.get_json()

    if "form_id" in data and "responses" in data:
        form_data = loadForm(data["form_id"])

        if form_data is not None:
            responses = data["responses"]
            form_id = form_data["id"]
            form_name = form_data["form_name"]
            requires_auth = form_data.get("requires_auth", False)

            if requires_auth and not await discord.authorized:
                return unauthorized

            if isinstance(responses, dict) and all(
                isinstance(question, str)
                and isinstance(response, str)
                and question.strip()
                and response.strip()
                for question, response in responses.items()
            ):
                cleaned_responses = {
                    question: response.strip()
                    for question, response in responses.items()
                }
                try:
                    embed = Embed(
                        color=Color.green(),
                        title=form_name,
                        url=f"{request.root_url.removesuffix('/')}{url_for('.view')}?form={form_id}",
                    )
                    if requires_auth:
                        user = await discord.fetch_user()
                        embed.set_author(
                            name=f"{user.name} ({user.id})", icon_url=user.avatar_url
                        )
                    for question, response in cleaned_responses.items():
                        embed.add_field(name=question, value=response, inline=False)
                    embed_dict = embed.to_dict()
                    async with ClientSession() as sess:
                        async with sess.post(
                            form_data.get("webhook_url"), json={"embeds": [embed_dict]}
                        ) as resp:
                            resp.raise_for_status()
                except ClientResponseError as err:
                    return Response(
                        json.dumps(
                            {
                                "status": "Failed",
                                "error": f"Webhook sending failed: {err.status}",
                            }
                        ),
                        status=500,
                        mimetype="application/json",
                    )

                return Response(
                    json.dumps({"status": "Success"}),
                    status=200,
                    mimetype="application/json",
                )

    return bad_request


@app.errorhandler(Unauthorized)
async def redirect_unauthorized(e):
    return redirect(url_for("login"))


@app.errorhandler(404)
async def redirect_404(e):
    return redirect("/")


app.run("127.0.0.1", debug=True)
