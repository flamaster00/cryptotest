const API_KEY = 'a83b71ead1410da8b61a6d8e71c12b3d3af8b44aeabc9514d211c3177968a0fe';

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

const AGGREGATE_INDEX = '5';

const tickersHandlers = new Map();

socket.addEventListener('message', e => {
    const {TYPE: type, FROMSYMBOL: fromSymbol, TOSYMBOL: toSymbol, PRICE: newPrice, MESSAGE: message, PARAMETER: parameter} = JSON.parse(e.data);

    if (parameter) {
        
        const splittedParameter = parameter?.split('~'); // ['5', 'CCCAGG', 'AVA', 'USD']
        const coinName = splittedParameter[2]
        const currencyName = splittedParameter[3]

        if (message === 'INVALID_SUB' && currencyName === 'USD') {
            // no COIN-USD exchange, subscribe to COIN-BTC
            const coinPrice = '-';
            const isCoinValid = true;
            const hasUSDExchange = false;
            const priceToBTC = '-';
            const handlers = tickersHandlers.get(coinName) ?? [];

            handlers.forEach(fn => fn(coinPrice, isCoinValid, hasUSDExchange, priceToBTC)); //(price, isValid, hasUSDExchange, priceToBTC)
            sendToWebSocket({
                "action": "SubAdd",
                "subs": [`5~CCCAGG~${coinName}~BTC`]
            });

        }

        if (message === 'INVALID_SUB' && currencyName === 'BTC') {
            // Exchange COIN-BTC doesn't exist
            const coinPrice = '-';
            const isCoinValid = false;
            const hasUSDExchange = false;
            const priceToBTC = '-';
            const handlers = tickersHandlers.get(coinName) ?? [];
            
            console.log(handlers);
            return handlers.forEach(fn => fn(coinPrice, isCoinValid, hasUSDExchange, priceToBTC)); //(price, isValid, hasUSDExchange, priceToBTC)
        }
    }


    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }

    if (toSymbol === 'BTC') {
        if (!tickersHandlers.get('BTC')) {
            // subscribe to BTC-USD exchange
            return sendToWebSocket({
                "action": "SubAdd",
                "subs": [`5~CCCAGG~BTC~USD`]
            });
        } else {
            //update coin-BTC exchange
            const coinPrice = '-';
            const isCoinValid = true;
            const hasUSDExchange = false;
            const priceToBTC = newPrice;
            const handlers = tickersHandlers.get(fromSymbol) ?? [];
            console.log(fromSymbol);
debugger;
            return handlers.forEach(fn => fn(coinPrice, isCoinValid, hasUSDExchange, priceToBTC)); //(price, isValid, hasUSDExchange, priceToBTC)
        }
    }

            const coinPrice = newPrice;
            const isCoinValid = true;
            const hasUSDExchange = true;
            const priceToBTC = '-';
            const handlers = tickersHandlers.get(fromSymbol) ?? [];
            console.log(fromSymbol);
            console.log(handlers);
    handlers.forEach(fn => fn(coinPrice, isCoinValid, hasUSDExchange, priceToBTC)); //(price, isValid, hasUSDExchange, priceToBTC)
})



function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message);
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage);
        return;
    }

    socket.addEventListener('open', () => {
        socket.send(stringifiedMessage);
    }, {once: true});
}

function subscribeToTickerOnWS(ticker) {
    sendToWebSocket({
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    });
}

function unSubscribeFromTickerOnWS(ticker) {
    sendToWebSocket({
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    });
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
    subscribeToTickerOnWS(ticker);
};

export const unsubscribeFromTicker = ticker => {
    
    tickersHandlers.delete(ticker);
    unSubscribeFromTickerOnWS(ticker);
};
