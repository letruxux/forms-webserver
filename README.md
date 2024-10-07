# forms thing

# PLEASE DON'T USE THIS
This project was for learning server / client connections years ago.
I didn't want to delete it just because it's history yk
It may have security vulns and is bad overall. DON'T USE!

## (bad) features
* discord auth (too lazy to make a custom system but better security i guess)
* clientside and serverside checks
* json forms
* discord webhook submissions

## todo:
- [x] fix webhook leaking to the client
- [x] stricter submitting and creating
- [ ] ratelimit (2mins to create and 1min to submit?? something like that)
- [ ] uuh mongodb i think

## installation
* `git clone` this repo
* cd to the cloned repo
* run `pip install -r requirements.txt`
* add a config.py liek this
```py
DISCORD_CLIENT_ID = 0
DISCORD_CLIENT_SECRET = ""
DISCORD_REDIRECT_URI = ""
DISCORD_BOT_TOKEN = ""
```
also add a redirect like this

![image](https://github.com/letruxux/forms-webserver/assets/102257756/b7760cf1-50ff-4b8f-8708-19a02e190a12)
