const GAME_STATE = {
    FirstCardAwaits: "FirstCardAwaits",
    SecondCardAwaits: "SecondCardAwaits",
    CardsMatchFailed: "CardsMatchFailed",
    CardsMatched: "CardsMatched",
    GameFinished: "GameFinished",
}

const Symbols = [
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
    'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const utility = {
    //得到隨機的陣列（Fisher-Yates Shuffle 洗牌演算法）
    getRandomNumberArray(count) {
        const number = Array.from(Array(count).keys())
        for (let index = number.length - 1; index > 0; index--) {
            let randomIndex = Math.floor(Math.random() * (index + 1));
            [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
        }
        return number
    }
}

//集中管理資料
const model = {
        revealedCards: [], //被翻開的卡片
        score: 0,
        triedTimes: 0,
        //判斷是否配對成功（回傳true/false)
        isRevealedCardsMatched() {
            return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
        }
    }
    //管理視覺呈現
const view = {
    //拿到卡片HTML資料（背面）
    getCardElement(index) {
        return `<div class="card back" data-index="${index}"></div>`
    },

    //拿到卡片HTML資料（正面）
    getCardContent(index) {
        const number = this.transformNumber((index % 13) + 1)
        const symbol = Symbols[Math.floor(index / 13)]
        return `<p>${number}</p>
    <img src="${symbol}" alt="">
    <p>${number}</p>`
    },
    //渲染全部牌面
    displayCards() {
        const rootElement = document.querySelector('#cards')
        rootElement.innerHTML = utility.getRandomNumberArray(52)
            .map(index => this.getCardElement(index))
            .join('')
    },
    //把數字轉換成字母
    transformNumber(number) {
        switch (number) {
            case 1:
                return 'A'
            case 11:
                return 'J'
            case 12:
                return 'Q'
            case 13:
                return 'K'
            default:
                return number
        }
    },
    //翻牌
    flipCards(...cards) {
        cards.map(card => {
            if (card.classList.contains('back')) {
                //回傳正面
                card.classList.remove('back')
                card.innerHTML = this.getCardContent(Number(card.dataset.index))
                return
            }
            //回傳背面
            card.classList.add('back')
            card.innerHTML = null
        })
    },
    //卡片配對成功，把卡片背景變成灰色
    pairCards(...cards) {
        cards.map(card => {
            card.classList.add('paired')
        })
    },
    //更新分數
    renderScore(score) {
        document.querySelector('.score').textContent = `score:${score}`
    },
    //更新點擊次數
    renderTriesTimes(times) {
        document.querySelector('.tried').textContent = `You've tried: ${times} times`
    },
    //增加閃爍動畫
    appendWrongAnimation(...cards) {
        cards.map(card => {
            card.classList.add('wrong')
            card.addEventListener('animationend', event =>
                event.target.classList.remove('wrong'), { once: true }
            )
        })
    },
    //顯示結束遊戲
    showGameFinished() {
        const div = document.createElement('div')
        div.classList.add('completed')
        div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
        const header = document.querySelector('#header')
        header.before(div)
    }
}

// 控制遊戲流程
const controller = {
    currentState: GAME_STATE.FirstCardAwaits,
    //遊戲開始Start
    generateCards() {
        view.displayCards(utility.getRandomNumberArray(52))
    },
    //統一控制遊戲流程
    dispatchCardAction(card) {
        if (!card.classList.contains('back')) {
            return
        }
        switch (this.currentState) {
            case GAME_STATE.FirstCardAwaits:
                view.flipCards(card)
                model.revealedCards.push(card)
                this.currentState = GAME_STATE.SecondCardAwaits
                break
            case GAME_STATE.SecondCardAwaits:
                view.renderTriesTimes(++model.triedTimes)
                view.flipCards(card)
                model.revealedCards.push(card)
                    //判斷是否配對成功
                if (model.isRevealedCardsMatched()) {
                    //配對成功
                    view.renderScore(model.score += 10)
                    this.currentState = GAME_STATE.CardsMatched
                    view.pairCards(...model.revealedCards)
                    model.revealedCards = []
                    if (model.score === 260) {
                        console.log('showGameFinished')
                        this.currentState = GAME_STATE.GameFinished
                        view.showGameFinished() // 加在這裡
                        return
                    }
                    this.currentState = GAME_STATE.FirstCardAwaits
                } else {
                    this.currentState = GAME_STATE.CardsMatchFailed
                    view.appendWrongAnimation(...model.revealedCards)
                    setTimeout(controller.resetCards, 1000)
                }
                break
        }
    },
    //配對失敗，牌翻回背面，清空暫存區
    resetCards() {
        view.flipCards(...model.revealedCards)
        model.revealedCards = []
        controller.currentState = GAME_STATE.FirstCardAwaits
    }
}

controller.generateCards()

//node list(array-like)
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', event => {
        controller.dispatchCardAction(card)
    })
});