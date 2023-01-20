import os
import json
import flask
import random
from flask import request

# Lib
def song_scan(root,child=""): # Returns "x.mp3" or "xx\xx.mp3"
    fs = os.listdir(root+child)
    for f in fs:
        if os.path.isfile(root+child+"\\"+f):
            if not f.endswith('.mp3'):continue
            yield (child+"\\"+f)[1:]
        elif os.path.isdir(root+"\\"+child):
            yield from song_scan(root,child+'\\'+f)

def sample(s,n):
    random.shuffle(s)
    return s[:n]

# Loading Songs
os.chdir(os.path.dirname(__file__))
with open('config.json','r',encoding='utf-8') as f:
    config = f.read()
config = json.loads(config)

data_path = "data\\"+config['data']+".json"
with open(data_path) as f:
    history = f.read()
history = json.loads(history)

catagorys = {}
for bun in os.listdir(config['source']):
    cache = []
    if bun in config['ignore']:continue
    if not os.path.isdir(config['source']+"\\"+bun):continue
    cache = [*song_scan(config['source']+"\\"+bun)]
    if len(cache)==0:continue
    catagorys[bun] = cache

print('{0} Catagorys found'.format(len(catagorys)))
for key,value in catagorys.items():
    print("\t{0} -> {1} songs".format(key,len(value)))

# Configs
ROOT = os.path.dirname(__file__)
DEV  = False # Develop Mode
PORT = 8000
HOST = "localhost" 
THRE = True  # Multi Threading

# App Init
app = flask.Flask(__name__)

@app.route('/')
def index():
    return flask.redirect('/index.html')

@app.route('/<path:url>')
def file_proxy(url):
    ask_path = ROOT+"\\Frontend\\"+url.replace("/","\\")
    if os.path.isfile(ask_path):
        return flask.send_file(ask_path)
    return '404 Not Found , Sorry.'

@app.route('/download/<path:url>')
def explore(url):
    ask_path = config["source"]+"\\"+url.replace('/','\\')
    if os.path.isfile(ask_path):
        return flask.send_file(ask_path)
    return '404 Not Found , Sorry'

@app.route('/push',methods=['POST'])
def push():
    jsoned = request.get_json()
    for i in jsoned:
        if not i[0] in history: history[i[0]] = [0,0] 
        history[i[0]][0] += i[1]
        history[i[0]][1] += i[2]
    jsoned = json.dumps(history)
    with open(data_path,'w',encoding='utf-8') as f: 
        f.write(jsoned)
    return 'success'

@app.route('/song')
def song():
    options = sample([*catagorys.keys()],config['options'])
    answer  = random.choice(options)
    url     = answer+"\\"+random.choice(catagorys[answer])
    return json.dumps({'options':options,'answer':answer,'url':url})

@app.route('/history')
def get_history():
    cache = []
    for k,v in history.items():
        cache.append([k,*v])
    return json.dumps(cache)

# Program Entry
if __name__=='__main__':
    app.run(host=HOST,port=PORT,debug=DEV,threaded=THRE)