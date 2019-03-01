const { EventEmitter } = require('events');

/**
 * State manager with events support
 *
 * @class StateManager
 */
class StateManager extends EventEmitter {

    /**
     * Creates an instance of StateManager.
     * @param {Object} [options={}]
     * @memberof StateManager
     */
    constructor(options = {}) {
        super();
        this.model = options.model || {};
        this.conditions = options.conditions || {};
        this.state = options.state || {};
    }

    /**
     * Validate new state by required conditions
     *
     * @param {[String, Number]} value State value
     * @memberof StateManager
     */
    _validateConditions(value) {

        if (this.conditions[value] && typeof this.conditions[value] === 'object') {

            Object.keys(this.conditions[value]).map(key => {

                if (!this.conditions[value][key].includes(this.state[key])) {

                    const error = new Error(`State value "${value}" does not fit condition: "${key}" \
                        should be one of [${this.conditions[value][key].join(',')}] \
                        but current state is "${this.state[key]}"`);
                    this.emit('error', error);
                    throw error;
                }
            });
        }
    }

    /**
     * Validate new state by state changing rules
     *
     * @param {String} key
     * @param {[String, Number]} value
     * @memberof StateManager
     */
    _validateRules(key, value) {

        if (this.state[key] !== value && 
            typeof this.model[key][this.state[key]] === 'object' && 
            !this.model[key][this.state[key]].includes(value)) {

            const error = new Error(`State transition from "${this.state[key]}" to "${value}" is prohibited. \
                Allowed values are [${this.model[key][this.state[key]].join(',')}]`);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Trying to set a new value(s) of the state
     *
     * @param {Object} state New state
     * @returns {Promise} 
     * @memberof StateManager
     */
    async set(state = {}) {
        
        const validatedStates = Object.keys(state).map(key => {
            this._validateConditions(state[key]);
            this._validateRules(key, state[key]);

            return {
                key,
                fromState: this.state[key],
                toState: state[key]
            };
        });

        this.state = {
            ...this.state,
            ...state
        };

        validatedStates.map(currentState => this.emit('state_change', currentState));
        
        return this.state;
    }

    /**
     * Get current state value by key
     *
     * @param {String} key State key
     * @returns {String|Number}
     * @memberof StateManager
     */
    get(key) {

        if (!key) {

            return this.state;
        }

        if (!this.state[key]) {

            throw new Error('Unknown state');
        }

        return this.state[key];
    }
}

module.exports = StateManager;
