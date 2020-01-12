"use strict";

require('../libs.js');

function buyItem(tmpList, body) {
    if (!itm_hf.payMoney(tmpList, body)) {
        logger.logError("no money found");
        return "";
    }

    logger.logSuccess("Bought item: " + body.item_id);

    if (body.tid === "579dc571d53a0658a154fbec") {
        body.tid = "ragfair";
    }
    
    return move_f.addItem(tmpList, body, item.getOutput());
}

// Selling item to trader
function sellItem(tmpList, body) {
    item.resetOutput();

    let money = 0;
    let prices = json.parse(profile.getPurchasesData(body.tid));
    let output = item.getOutput();

    // find the items to sell
    for (let i in body.items) {
        // print item trying to sell
        logger.logInfo("selling item" + json.stringify(body.items[i]));

        // profile inventory, look into it if item exist
        for (let item of tmpList.data[0].Inventory.items) {
            let isThereSpace = body.items[i].id.search(" ");
            let checkID = body.items[i].id;

            if (isThereSpace !== -1) {
                checkID = checkID.substr(0, isThereSpace);
            }

            // item found
            if (item._id === checkID) {
                logger.logInfo("Selling: " + checkID);

                // remove item
                output = move_f.removeItem(tmpList, checkID, output);
                move_f.removeInsurance(tmpList, checkID);

                // add money to return to the player
                let price_money = prices.data[item._id][0][0].count;

                if (output !== "BAD") {
                    money += price_money;
                } else {
                    return "";
                }
            }
        }
    }

    // get money the item
    output = itm_hf.getMoney(tmpList, money, body, output);
    return output;
}

// separate is that selling or buying
function confirmTrading(tmpList, body) {
    // buying
    if (body.type === "buy_from_trader") {
        return buyItem(tmpList, body);
    }

    // selling
    if (body.type === "sell_to_trader") {
        return sellItem(tmpList, body);
    }

    return "";
}

// Ragfair trading
function confirmRagfairTrading(tmpList, body) {
    item.resetOutput();

    let offers = body.offers;
    let output = item.getOutput()

    for (let offer of offers) {
        tmpList = profile.getCharacterData();
        body = {};
        body.Action = "TradingConfirm";
        body.type = "buy_from_trader";
        body.tid = "ragfair";
        body.item_id = offer.id;
        body.count = offer.count;
        body.scheme_id = 0;
        body.scheme_items = offer.items;

        let tmpOutput = confirmTrading(tmpList, body);

        // this compiles all the offers that will eventually be sent back into one
        // response to handle the ragfair purchase (multiple offer purchase ie. preset purchases)
        for (let item of tmpOutput.data.items.new) {
            output.data.items.new.push(item);
        }

        for (let item of tmpOutput.data.items.change) {
            output.data.items.change.push(item);
        }
    }
    return output;
}

module.exports.buyItem = buyItem;
module.exports.sellItem = sellItem;
module.exports.confirmTrading = confirmTrading;
module.exports.confirmRagfairTrading = confirmRagfairTrading;