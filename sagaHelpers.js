import { take, fork, put, call } from 'redux-saga/effects';

const writeActionTypes = (key) => Symbol(`REDUCER_WRITE_${key}`);
export const writingActions = {};


export function write(model, reducer) {
  const writer = function* () {
    const ns = model.nameSpace;
    const writingActionType = writeActionTypes(ns);
    writingActions[writingActionType] = true;

    yield put({
      type: writingActionType,
      nameSpace: ns,
      reducer,
    });
  };
  return call([model, writer])
}

export function watch(sagas) {
  const workers = {};
  sagas.forEach((saga) => {
    workers[saga.actionType] = saga;
  });
  return function* watcher() {
    try {
      while (true) {
        const action = yield take(Object.keys(workers));
        yield fork(workers[action.type], action);
      }
    } catch (e) {
      console.error('saga watcher error:', e, sagas);
    }
  }
}
