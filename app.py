import json, time, os, datetime
from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify

app = Flask(__name__)

_savedir = 'static/game_data/'

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/save_game', methods=['POST'])
def save_game():
    print 'saving'

    if 'data' not in request.form: return 'invalid data'
    data = json.loads(request.form['data'])
    game_name = request.form['fname'].replace('.json', '')
    print game_name, data

    if game_name:
        if os.path.isfile(_savedir + '%s.json' % game_name):
            fname = '%s_%s.json' %\
                (game_name, str(datetime.datetime.now()).replace(' ', '').replace(':','-'))
        else:
            fname = '%s.json' % game_name
    else:
        fname = 'temp.json'

    # make the directory
    # os.makedirs(savedir)

    with open(_savedir + fname, 'w') as outfile:
        json.dump(data, outfile, indent=4, sort_keys=True)

    return fname

@app.route('/get_games', methods=['GET'])
def get_saved_games():
    saved_names = filter(lambda f: f.endswith('.json'), os.listdir('static/game_data/'))
    return json.dumps(saved_names)

@app.route('/load_game', methods=['GET'])
def load_game():
    fname = request.args.get('fname', '')

    try:
        with open(_savedir + fname) as game_file:
            file_json = json.load(game_file)
            return jsonify({'game_data': file_json})

    except Exception as e:
        print 'exception!'
        print e
        return jsonify({'error': e})

if __name__ == "__main__":
    app.debug = True
    app.run(port=8900)

