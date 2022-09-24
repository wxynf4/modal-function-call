# 基于Element Plus函数式调起组件弹窗

## 安装
```
yarn add modal-function-call
```

## 用法
```
// main.js
import ModalFunctionCall from 'modal-function-call'
app.use(ModalFunctionCall)

//xxx.vue
import { useModal } from "modal-function-call";
const { 
    showModal,
    closeModal,
    getParams,
    onConfirm,
    onCancel, 
} = useModal();

```

### 详细用法看源码...