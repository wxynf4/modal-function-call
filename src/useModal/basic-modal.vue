<script>
import { ref, defineComponent, h } from "vue";
import { ElDialog, ElSpace, ElButton } from 'element-plus';

/**
 * 弹窗组件构造
 */
export default defineComponent({
  name: 'basic-modal',
  props: {
    /**
     * 弹窗的配置（与ElDialog配置相同）
     */
    opts: {
      type: Object,
      default: () => {}
    },
    /**
     * 底部插槽配置
     */
    footerOpts: {
      type: Object,
      default: () => {}
    },
  },
  setup(props, { expose, slots }) {
    /**
     * 是否显示确认按钮loading
     * @type {Ref<UnwrapRef<boolean>>}
     */
    const isConfirmLoading = ref(false);
    /**
     * 是否显示弹窗
     * @type {Ref<UnwrapRef<boolean>>}
     */
    const isShow = ref(true);
    /**
     * 弹窗配置
     */
    const modalOpts = {
      ...props.opts,
    }
    /**
     * 底部插槽配置
     */
    const footerOpts = {
      isUseDefaultFooter: true,
      confirmText: "确认",
      cancelText: "取消",
      onConfirm: () => {},
      onCancel: () => {},
      ...props.footerOpts,
    }

    /**
     * 处理确认按钮点击
     */
    function handleConfirm() {
      isConfirmLoading.value = true;
      footerOpts.onConfirm();
    }

    /**
     * 处理取消按钮点击
     */
    function handleCancel() {
      footerOpts.onCancel();
    }

    /**
     * 处理弹窗关闭
     */
    function handleClose() {
      modalOpts.onClosed();
    }

    /**
     * 抛出关闭弹窗以及隐藏确认按钮loading方法
     */
    expose({
      closeModal: () => {
        isShow.value = false;
      },
      hideLoading: () => {
        isConfirmLoading.value = false;
      }
    })

    /**
     * 渲染底部插槽的按钮
     * @returns {VNode<RendererNode, RendererElement, {[p: string]: any}>[]}
     */
    function renderFooterBtnSlot() {
      // 确认按钮
      const confirm = h(
          ElButton,
          {
            type: 'primary',
            loading: isConfirmLoading.value,
            onClick: handleConfirm,
          },
          {
            default: () => footerOpts.confirmText,
          }
      );
      // 取消按钮
      const cancel = h(
          ElButton,
          {
            onClick: handleCancel,
          },
          {
            default: () => footerOpts.cancelText,
          }
      );
      return [confirm, cancel]
    }

    /**
     * 渲染底部插槽
     * @returns {null|VNode}
     */
    function renderFooterSlot() {
      if (!footerOpts.isUseDefaultFooter) return null;
      return h(
          ElSpace,
          null,
          {
            default: renderFooterBtnSlot
          }
      )
    }
    return () => {
      return h(
          ElDialog,
          {
            showClose: true,
            ...modalOpts,
            modelValue: isShow.value,
            onClosed: handleClose,
            onClose: () => {},
          },
          {
            default: () => h(slots.default),
            footer: renderFooterSlot,
          }
      )
    }
  }
})
</script>
