import { all } from "redux-saga/effects";
import { writingActions } from './sagaHelpers';

export function model(nameSpace, modelObj, initState) {
  try {
    const newModel = {};
    Object.keys(modelObj).forEach((key) => {
      if (key === 'root') {
        if (typeof modelObj[key] !== 'function') {
          console.error('root should be a function or generator');
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
      } else {
        Object.defineProperty(newModel, key, {
          value: modelObj[key],
          writable: true,
          enumerable: false,
          configurable: true
        });
      }
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
    Object.defineProperty(newModel,'action',{
      value:action,
      enumerable: false
    });
    Object.defineProperty(newModel,'initState',{
      value:initState,
      enumerable: false
    });
    Object.defineProperty(newModel,'nameSpace',{
      value:nameSpace,
      enumerable: false
    });

    return newModel;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export function combineModels(models, rootSelector = s => s) {
  const modelInitStates = {};
  const modelRootSagas = {};
  models.forEach((model) => {
    model.select = (s) => rootSelector(s)[model.nameSpace];
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

  return { reducer, saga }
}