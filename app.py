import json, time, os, datetime
from flask import Flask
from flask import render_template
from flask import request

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/save_game', methods=['POST'])
def save_game():
    print 'saving'
    if 'data' not in request.form: return 'invalid data'
    data = json.loads(request.form['data'])
    print data

    if 'game_settings' not in data or 'events' not in data or 'flags' not in data:
        return 'invalid data'
    game_settings = data['game_settings']
    events = data['events']
    flags = data['flags']

    savedir = 'game_data/%s/' % datetime.datetime.now()
    os.makedirs(savedir)

    with open(savedir + 'game_settings.json', 'w') as outfile:
        json.dump(game_settings, outfile, indent=4, sort_keys=True)

    with open(savedir + 'events.json', 'w') as outfile:
        json.dump(events, outfile, indent=4, sort_keys=True)

    with open(savedir + 'flags.json', 'w') as outfile:
        json.dump(flags, outfile, indent=4, sort_keys=True)

    return 'success'

if __name__ == "__main__":
    app.run(port='8900')