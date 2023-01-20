player = new Audio

// PASSED
function playerSync(){
    data.playing = !player.paused
    if (data.rangerFocus) return
    if (isNaN(player.duration)){
        data.playPercent = 0
        return
    }else {
        data.playPercent = player.currentTime / player.duration * 100
    }
}

function volSet(){
    if (data.volset) return
    data.volset = true
    setTimeout(()=>{
        document.querySelector('.player-vol > input').focus()
    },20)
}

function playToggle(){
    if (player.paused)player.play()
    else player.pause()
}

async function testFetch(){
    let jsoned = await (await fetch('/song')).json()
    data.choice  = ''
    data.answer  = jsoned.answer
    data.options = jsoned.options
    player.src = "/download/"+jsoned.url
    console.log('testFetchCalled')
    try{
        await player.play()
    }catch{
        document.addEventListener('mousedown',autoPlayHook)
    }
}

function opBg(op){
    if (data.choice=='')return ''
    if (op==data.answer){
        return 'background:#01bd75C0'
    }else if(op==data.choice){
        return 'background:#c00202C0'
    }
}
// PASSED END

maxs         = []
counter      = []
scoreBoard   = []
toPushBoard  = []
historyBoard = []

function calcer(){
    let Board = [scoreBoard,historyBoard][data.displayMode]
    let a = 0 ; let b = 0
    let c = 0 ; let d = 0
    for (let i of Board){
        if (i[1]>a) a = i[1]
        if (i[2]>b) b = i[2]
        c += i[1]
        d += i[2]
    }
    maxs    = [a,b]
    counter = [c,d]
}

function statTitleSet(){
    let Board = [scoreBoard,historyBoard][data.displayMode]
    let bgs = ['#01bd7580','#01bd7580','#01bd7580','#1779e280']

    if (data.sortby==0){
        data.statTitle = `
            --bg:${bgs[data.sortby]};
            --end:${(counter[0]/counter[1]*100).toFixed(2)}%;
            --text:'${(counter[0]/counter[1]*100).toFixed(0)}%';
        `
    }else if(data.sortby==1){
        data.statTitle = `
            --bg:${bgs[data.sortby]};
            --end:${(counter[0]/counter[1]*100).toFixed(2)}%;
            --text:'${counter[0]}/${counter[1]}';
        `
    }else if(data.sortby==2){
        data.statTitle = `
            --bg:${bgs[data.sortby]};
            --end:${(counter[0]/Board.length/maxs[0]*100).toFixed(2)}%;
            --text:'${(counter[0]/Board.length).toFixed(1)};${counter[0]}';
        `
    }else if(data.sortby==3){
        data.statTitle = `
            --bg:${bgs[data.sortby]};
            --end:${(counter[1]/Board.length/maxs[1]*100).toFixed(2)}%;
            --text:'${(counter[1]/Board.length).toFixed(1)};${counter[1]}';
        `
    }
}

function addCount(Board){
    let doAdd = true
    for(let i of Board){
        if (data.answer==i[0]){
            if (data.choice==data.answer)i[1]+=1
            i[2]  += 1 
            doAdd = false
            break
        }
    }
    if(doAdd){
        let cache = [data.answer,0,1]
        if (data.choice==data.answer)cache[1]+=1
        Board.push(cache)
    }
}

function choose(op){
    if (data.choice==''){
        data.choice = op
        addCount(scoreBoard)
        addCount(toPushBoard)
        if (toPushBoard.length) data.pushAble = 1
        calcer()
        statTitleSet()
        if (data.displayMode==0) renderPad()
    }
}

pushing = false
async function pushBoard(){
    if (pushing) return
    pushing = true
    if (toPushBoard.length==0)return
    await fetch('/push',{
        headers:{'Content-Type':'application/json'},
        method:"POST",
        body:JSON.stringify(toPushBoard)
    })
    if (data.displayMode==1){
        historyBoard = await (await fetch('/history')).json()
        calcer()
        statTitleSet()
        renderPad()
    }
    data.pushAble = 0
    toPushBoard   = []
    pushing = false
}

function renderPad(){
    Board = [scoreBoard,historyBoard][data.displayMode]
    Board.sort(sorters[data.sortby])
    let cache = []
    for(let i of Board){
        cache.push([i[0],DisplayRate(i),DisplayText(i)])
    }
    data.renderPad = cache
}

async function displayModeChange(){
    data.displayMode = 1 - data.displayMode
    if (data.displayMode==1){
        historyBoard = await (await fetch('/history')).json()
    }
    calcer()
    statTitleSet()
    renderPad()
}

sorters = [sortbyCorrectRate,sortbyCorrectRate,sortbyCorrectCount,sortbyTestCount]
function sortbyCorrectRate(a,b){return (b[1]/b[2])-(a[1]/a[2])}
function sortbyCorrectCount(a,b){return b[1]-a[1]}
function sortbyTestCount(a,b){return b[2]-a[2]}

function changeDisplayMode(){
    data.sortby += 1
    if (data.sortby>3) data.sortby = 0
    statTitleSet()
    renderPad()
}

function DisplayRate(item){
    if (data.sortby==0 || data.sortby==1){
        return `--end:${((item[1]/item[2])*100).toFixed(2)}%`
    }else if(data.sortby==2){
        return `--end:${(item[1]/maxs[0]*100).toFixed(2)}%`
    }else if(data.sortby==3){
        return `--end:${(item[2]/maxs[1]*100).toFixed(2)}%;--bg:#1779e2;`
    }
}

function DisplayText(item){
    if (data.sortby==0){
        return `${(item[1]/item[2]).toFixed(2)*100}%`  // 10%
    }else if(data.sortby==1){
        return `${item[1]}/${item[2]}` // xx/xx
    }else if(data.sortby==2){
        return `${item[1]}`
    }else if(data.sortby==3){
        return `${item[2]}`
    }
}

// PASSED
document.addEventListener('alpine:init',()=>{
    data = Alpine.reactive({
        playing:false,
        playPercent:0,
        volume:100,
        volset:false,
        options:[],
        answer:'',
        choice:'',
        sortby:0, // 0,1 -> correctRate , 2 -> correctCount , 3 -> testNum 
        rangerFocus:false,
        renderPad:[],
        displayMode:0,    // 0-> thisTime , 1->History
        pushAble:0,        // 0-> unable
        statTitle:''
    })
    setInterval(() => {
        playerSync()
    }, 100);
    testFetch()
})

function autoPlayHook(){
    if (player.paused)player.play()
    document.removeEventListener('mousedown',autoPlayHook)
}
// PASSED END