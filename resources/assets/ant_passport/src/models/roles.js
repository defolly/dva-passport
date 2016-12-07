import { hashHistory } from 'dva/router';
import { parse } from 'qs';
import pathToRegexp from 'path-to-regexp';
import { query, create, remove, update, deny } from '../services/roles';

export default {
  namespace: 'roles',
  state: {
    list: [],
    expand: false,
    keyword: '',
    total: null,
    loading: false,
    current: 1,
    currentItem: {},
    modalVisible: false,
    modalType: 'create',
  },
  reducers: {
    showLoading(state, action) {
      return { ...state, loading: true };
    },
    showModal(state, action) {
      return { ...state, ...action.payload, modalVisible: true };
    },
    hideModal(state, action) {
      return { ...state, modalVisible: false };
    },
    querySuccess(state, action) {
      return { ...state, ...action.payload, loading: false };
    },
    createSuccess(state, action) {
      return { ...state, ...action.payload, loading: false };
    },
    deleteSuccess(state, action) {
      const id = action.payload;
      const newList = state.list.filter(role => role.id !== id);
      return { ...state, list: newList, loading: false };
    },
    updateSuccess(state, action) {
      const updateRole = action.payload;
      const newList = state.list.map(role => {
        if (role.id === updateRole.id) {
          return { ...role, ...updateRole };
        }
        return role;
      });
      return { ...state, list: newList, loading: false };
    },
    updateQueryKey(state, action) {
      return { ...state, ...action.payload };
    },
  },
  effects: {
    *query({ payload }, { call, put }) {
      yield put({ type: 'showLoading' });
      yield put({
        type: 'updateQueryKey',
        payload: { page: 1, keyword: '', ...payload },
      });
      const { data } = yield call(query, parse(payload));
      if (data && data.err_msg == 'SUCCESS') {
        yield put({
          type: 'querySuccess',
          payload: {
            list: data.data.list,
            total: data.data.total,
            current: data.data.current,
          },
        });
      }
    },
    *create({ payload }, { call, put }) {
      yield put({ type: 'hideModal' });
      yield put({ type: 'showLoading' });
      const { data } = yield call(create, payload);
      if (data && data.err_msg == 'SUCCESS') {
        yield put({
          type: 'query',
        });
      }
    },
    *'delete'({ payload }, { call, put }) {
      yield put({ type: 'showLoading' });
      const { data } = yield call(remove, { id: payload });
      if (data && data.err_msg == 'SUCCESS') {
        yield put({
          type: 'deleteSuccess',
          payload,
        });
      }
    },
    *update({ payload }, { select, call, put }) {
      yield put({ type: 'hideModal' });
      yield put({ type: 'showLoading' });
      const id = yield select(({ roles }) => roles.currentItem.id);
      const newRole = { ...payload, id };
      const { data } = yield call(update, newRole);
      if (data && data.err_msg == 'SUCCESS') {
        yield put({
          type: 'updateSuccess',
          payload: newRole,
        });
      }
    },
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen(location => {
        const match = pathToRegexp(`/roles`).exec(location.pathname);
        if (match) {
          dispatch({
            type: 'query',
            payload: location.query,
          });
        }
      });
    },
  },
}
