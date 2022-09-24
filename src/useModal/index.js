import { h, isRef, isReactive, unref, toRaw, render } from 'vue'
import { cloneDeep } from 'lodash-es'
import BasicModal from './basic-modal.vue';

let appContext = null;
const modalInstanceMap = new Map();

/**
 * 函数式调起弹窗
 * @param compName 父组件不需要传入此参数。子组件使用时，需要传入组件名称
 * @returns {{onCancel: onCancel, onConfirm: onConfirm, closeModal: closeModal, showModal: (function(*): Promise<unknown>), getParams: ((function(): (*|null))|*)}}
 */
export function useModal (compName = '') {
    // 实例
    let instance = {
        vNode: null,
        el: null,
        component: null,
        resolve: null,
        compParams: null,
        confirmCallback: null,
        cancelCallback: null,
    };
    // 判断是否传入组件名称以获取组件实例
    if (compName) {
        // 获取组件实例
        instance = modalInstanceMap.get(compName);
        if (!instance) {
            throw new Error(`${compName}组件实例不存在`);
        }
    }

    /**
     * 显示弹窗
     * @returns {Promise<unknown>}
     * @param options
     * @param options-component 组件实例
     * @param options-compParams 组件参数
     * @param options-modalOpts 弹窗自定义参数（参考ele官网dialog参数）
     * @param options-modalTitle 弹窗标题，优先级小于自定义参数
     */
    function showModal(options) {
        return new Promise(resolve => {
            /**
             * comp 组件实例
             * params 组件参数
             * opts 弹窗自定义参数（参考ele官网dialog参数）
             * title 弹窗标题，优先级小于自定义参数
             * footerOpts 底部自定义参数，可关闭默认底部
             */
            const { comp = {}, params = {}, opts = {}, title = '', footerOpts = {} } = options;
            instance.component = comp;
            const modalOpts = {
                title,
                ...opts,
            }
            // 底部自定义参数
            const innerFooterOpts = {
                confirmText: '确定',
                cancelText: '取消',
                isUseDefaultFooter: true, // 使用默认底部插槽
                ...footerOpts,
            }
            /**
             * 处理组件参数
             */
            instance.compParams = paramsToRaw(params)
            // 挂在body下
            instance.el = document.createElement('div');
            document.body.append(instance.el);
            /**
             * 创建新的vue实例，渲染弹窗
             */
            const vNode = h(
                BasicModal,
                {
                    opts: {
                        onClosed: close,
                        ...modalOpts,
                    },
                    footerOpts: {
                        onConfirm: confirm,
                        onCancel: cancel,
                        ...innerFooterOpts
                    }
                },
                {
                    default: () => h(comp, {
                        ...instance.compParams
                    })
                }
            );
            vNode.appContext = appContext;
            render(vNode, instance.el);
            // promise回调给外部
            instance.resolve = resolve;
            instance.vNode = vNode;
            // 设置弹窗实例map
            modalInstanceMap.set(comp.name, instance);
        })
    }

    /**
     * 内部方法关闭弹窗
     * @param args then返回的参数
     */
    function close(args) {
        if (instance) {
            instance.resolve(paramsToRaw(args) || false);
            render(null, instance.el);
            instance.el.parentNode.removeChild(instance.el);
            modalInstanceMap.delete(instance.component.name);
        }
    }
    /**
     * 内部方法-确认按钮回调
     */
    function confirm() {
        if (instance.confirmCallback) {
            // 回调方法返回false，隐藏按钮loading
            const cbResult = instance.confirmCallback(hideLoading);
            if (cbResult === false) {
                hideLoading();
            }
        } else {
            closeModal();
        }
    }
    /**
     * 内部方法-取消按钮回调
     */
    function cancel() {
        if (instance.cancelCallback) {
            instance.cancelCallback()
        } else {
            closeModal();
        }
    }
    /**
     * 隐藏确认按钮loading
     */
    function hideLoading() {
        if (instance) {
            instance.vNode.component.exposed?.hideLoading()
        } else {
            throw new Error('弹窗实例不存在')
        }
    }
    /**
     * 内部方法-返回原始参数
     * @param params
     * @returns {*}
     */
    function paramsToRaw(params) {
        if (isRef(params)) {
            return cloneDeep(unref(params))
        }
        if (isReactive(params)) {
            return cloneDeep(toRaw(params))
        }
        return cloneDeep(params)
    }

    /**
     * 关闭弹窗
     * @param args 参数
     */
    function closeModal(args) {
        if (instance) {
            // 隐藏弹窗，最终会触发close回调
            instance.vNode.component.exposed?.closeModal();
            // 延迟触发，保证弹窗完全关闭在触发回调
            const timer = setTimeout(() => {
                instance.resolve(paramsToRaw(args) || false);
                clearTimeout(timer);
            }, 300)
        } else {
            throw new Error('弹窗实例不存在')
        }
    }

    /**
     * 点击确认按钮回调
     * @param callback 回调方法（回调方法内部可return false 来取消确认按钮的loading状态。也可调用回调方法的形参方法来取消loading状态）
     */
    function onConfirm(callback) {
        if (instance) {
            instance.confirmCallback = callback;
        } else {
            throw new Error('弹窗实例不存在')
        }
    }
    /**
     * 点击取消按钮回调
     * @param callback 回调方法
     */
    function onCancel(callback) {
        if (instance) {
            instance.cancelCallback = callback;
        } else {
            throw new Error('弹窗实例不存在')
        }
    }

    /**
     * 获取传给弹窗的参数，子组件使用
     * @returns {null|*|null}
     */
    function getParams() {
        if (instance) {
            return instance.compParams;
        }
        return null;
    }

    return {
        showModal,
        closeModal,
        getParams,
        onConfirm,
        onCancel,
    }
}

export function install(_app) {
    appContext = _app._context;
}