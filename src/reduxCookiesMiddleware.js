import setCookie from './cookieApi';

/**
 * Middleware to persist state in cookies.
 * @param {Object} paths
 * @param {Object} options
 */
const reduxCookiesMiddleware = (paths = {}, options = {}) => {

    options = options || {
        logger: console.error,
        setCookie,
        defaultEqualityCheck: (a, b) => (a === b),
        defaultDeleteCheck: value => (typeof value === 'undefined'),
        expire: 365,
        secure: false,
        path: '/'
    };

    const _getVal = (state, path) => {
        const pathPartsList = path.split('.');
        let value = state;
        let index;

        for (index = 0; index < pathPartsList.length; index += 1) {
            const pathPart = pathPartsList[index];

            if (Object.hasOwnProperty.call(value, pathPart)) {
                value = value[pathPart];
            } else {
                options.logger(`state not found at store.getState().${path}`);
                break;
            }
        }

        return (index === pathPartsList.length) ? value : null;
    };

    return store => next => (action) => {
        const prevState = store.getState();
        const result = next(action);
        const nextState = store.getState();

        Object.keys(paths).forEach((pathToState) => {
            const prevVal = _getVal(prevState, pathToState);
            const nextVal = _getVal(nextState, pathToState);
            const state = paths[pathToState];
            const equalityCheck = state.equalityCheck || options.defaultEqualityCheck;
            const deleteCheck = state.deleteCheck || options.defaultDeleteCheck;

            const {name, expire, secure, path} = state || {
                expire: options.expire,
                secure: options.secure,
                path:options.path
            };
            if (!equalityCheck(prevVal, nextVal)) {
                if (deleteCheck(nextVal)) {
                    options.setCookie(name, JSON.stringify(nextVal), 0, secure, path);
                } else {
                    options.setCookie(name, JSON.stringify(nextVal), expire, secure, path);
                }
            }
        });

        return result;
    };
};

export default reduxCookiesMiddleware;
