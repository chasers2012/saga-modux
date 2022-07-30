import { all } from "redux-saga/effects";
import { writingActions } from './sagaHelpers';
import { Action } from "redux";

export function model<T extends { root: () => Generator, [key: string]: any }, S = any>(nameSpace: string,
  modelObj: T,
  initState?: S
) {
  try {
    const newModel = {};
    Object.keys(modelObj).forEach((key) => {
      if (key === 'root') {
        if (typeof modelObj[key] !== 'function') {
          throw new Error(`property 'root' of model ${nameSpace} should be a function or generator`);
        }
        Object.defineProperty(newModel, key, {
          value: modelObj[key].bind(newModel),
          writable: true,
          enumerable: false,
          configurable: true
        });
        return;
      }
      if (typeof modelObj[key] === 'function') {
        if (!/^_/.test(key)) {
          const actionType = nameSpace + '_' + key;
          newModel[key] = modelObj[key].bind(newModel);
          newModel[key].actionType = actionType;
          newModel[key].action = (data) => ({
            type: actionType,
            ...data
          });
        } else {
          Object.defineProperty(newModel, key, {
            value: modelObj[key].bind(newModel),
            writable: true,
            enumerable: false,
            configurable: true
          });
        }
        return;
      }

      Object.defineProperty(newModel, key, {
        value: modelObj[key],
        writable: true,
        enumerable: false,
        configurable: true
      });

    });
    Object.defineProperty(newModel, 'nameSpace', {
      value: nameSpace,
      writable: true,
      enumerable: false,
      configurable: true
    });

    const action = {};
    Object.keys(newModel).forEach((key) => {
      action[key] = newModel[key].action;
    });
    Object.defineProperty(newModel, 'action', {
      value: action,
      enumerable: false
    });
    Object.defineProperty(newModel, 'initState', {
      value: initState,
      enumerable: false
    });
    Object.defineProperty(newModel, 'nameSpace', {
      value: nameSpace,
      enumerable: false
    });
    Object.defineProperty(newModel, 'select', {
      value: function (s) {
        if (!this._rootSelector) {
          throw new Error(`model '${this.nameSpace}' should be added to 'combineModels()' before using .select method.`);
        }
        return this._rootSelector(s)[this.nameSpace];
      }.bind(newModel),
      enumerable: false,
      writable: false,
      configurable: false
    });
    return newModel as T & {
      action: {
        [key in keyof T]: (...args: Parameters<T[key]>) => Action
      },
      select: (store: any) => S
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export function combineModels(models, rootSelector = s => s) {
  const modelInitStates = {};
  const modelRootSagas = {};
  models.forEach((model) => {
    Object.defineProperty(model, '_rootSelector', {
      value: rootSelector,
      enumerable: false,
      writable: false,
      configurable: false
    });
    modelInitStates[model.nameSpace] = model.initState;
    modelRootSagas[model.nameSpace] = model.root();
  });
  const reducer = (state = modelInitStates, action) => {
    if (writingActions.hasOwnProperty(action.type)) {
      const { reducer, nameSpace } = action;
      return {
        ...state,
        [nameSpace]: reducer(state[nameSpace])
      }
    }
    return state;
  };

  function* saga() {
    try {
      yield all(modelRootSagas);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  return { reducer, saga: saga as () => Generator<any> }
}