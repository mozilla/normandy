export class Action {
    constructor(normandy, recipe) {
        this.normandy = normandy;
        this.recipe = recipe;
    }
}

/**
 * From the given list of objects, choose one based on their relative
 * weights and return it. Choices are assumed to be objects with a `weight`
 * property that is an integer.
 *
 * Weights define the probability a choices will be shown relative to other
 * weighted choices. If two choices have weights 10 and 20, the second one will
 * appear twice as often as the first.
 *
 * @param  {array}  choices  Array of weighted choices.
 * @return {object}          The chosen choice.
 */
export function weightedChoose(choices) {
    if (choices.length < 1) {
        return null;
    }

    let maxWeight = choices.map(c => c.weight).reduce((a, b) => a + b, 0);
    let chosenWeight = Math.random() * maxWeight;
    for (let choice of choices) {
        chosenWeight -= choice.weight;
        if (chosenWeight <= 0) {
            return choice;
        }
    }

    // We shouldn't hit this, but if we do, return the last choice.
    return choices[choices.length - 1];
}

// Attempt to find the global registerAction, and fall back to a noop if it's
// not available.
export let registerAction = null;

try {
    registerAction = global.registerAction;
} catch (err) {
    // Not running in Node.
}

if (!registerAction) {
    try {
        registerAction = window.registerAction;
    } catch (err) {
        // Not running in a browser.
    }
}

// If it still isn't found, just shim it.
if (!registerAction) {
    registerAction = function() { };
}
