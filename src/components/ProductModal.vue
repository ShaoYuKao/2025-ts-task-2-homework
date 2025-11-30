<!-- 
==========================================
TypeScript 練習題目 - 商品彈窗組件
==========================================

🎯 練習目標：
1. 學習 Vue 3 組件的 TypeScript 用法
2. 理解 Props 和 Emits 的型別定義
3. 練習組合式 API 的整合使用

📝 練習說明：
請為以下 script setup 區塊加上正確的 TypeScript 型別註解
-->

<script setup lang="ts">
// TODO: 匯入 API 函式
// 提示：從 @/api/products 匯入 apiCreateProduct, apiEditProduct
import { apiCreateProduct, apiEditProduct } from '@/api/products'
import { useImageUpload } from '@/composable/useImageUpload'
import { useProductForm } from '@/composable/useProductData'

// TODO: 匯入型別定義
// 提示：從 @/types/product 匯入 ProductData
import type { ProductData } from '@/types/product'
import { Modal } from 'bootstrap'

import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

// TODO: 定義 Props 介面
// 提示：ProductModalProps 應該包含 product 屬性，型別是 ProductData
interface ProductModalProps {
  product: ProductData
}

// TODO: 定義 props
// 提示：使用 defineProps<ProductModalProps>()
const { product } = defineProps<ProductModalProps>()

const emit = defineEmits(['get-products'])

// TODO: 為模板引用加上型別註解
// 提示：使用 useTemplateRef<HTMLElement>()
const modalRef = useTemplateRef<HTMLElement>('modalRef')

// TODO: 為 modal 變數加上型別註解
// 提示：型別是 Modal | null
let modal: Modal | null = null

onMounted(() => {
  if (modalRef.value) {
    modal = new Modal(modalRef.value)
  }
})

onUnmounted(() => {
  if (modal) {
    modal.dispose()
  }
})

const openModal = () => {
  if (modal) {
    modal.show()
  }
}

const closeModal = () => {
  if (modal) {
    modal.hide()
  }
}

const { form, formTitle, loadProduct } = useProductForm()

const {
  uploadedImages,
  imageUrlInput,
  fileToUpload,
  fileNameDisplay,
  isUploading,
  addImageUrl,
  triggerUpload,
  handleFileChange,
  deleteImage,
  resetImages,
} = useImageUpload()

watch(
  () => product,
  (newProduct) => {
    if (newProduct.id) {
      loadProduct(newProduct)
      resetImages([newProduct.imageUrl, ...newProduct.imagesUrl])
    } else {
      loadProduct(null)
      resetImages([])
    }
  },
  { immediate: true, deep: true },
)

const isEditMode = computed(() => Boolean(product.id))

const isLoading = ref(false)

const saveProduct = async () => {
  const [imageUrl, ...imagesUrl] = uploadedImages.value

  const { id, ...productData } = form.value

  productData.imageUrl = imageUrl
  productData.imagesUrl = imagesUrl

  const data = {
    ...productData,
    imagesUrl: productData.imagesUrl ? productData.imagesUrl : [''],
  }

  isLoading.value = true

  try {
    if (isEditMode.value && id) {
      await apiEditProduct({ data, id })
    } else {
      await apiCreateProduct(data)
    }
    resetImages([])
    closeModal()
  } catch (error) {
    alert('新增/編輯產品失敗')
  } finally {
    isLoading.value = false
    emit('get-products')
  }
}

defineExpose({
  openModal,
  closeModal,
})
</script>

<template>
  <div
    ref="modalRef"
    class="modal fade"
    id="addNewProductModal"
    tabindex="-1"
    aria-labelledby="addNewProductModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content rounded-lg">
        <div class="modal-header">
          <h5 class="modal-title" id="addNewProductModalLabel">{{ formTitle }}</h5>
          <button
            @click="closeModal"
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-6">
              <form>
                <div class="mb-3">
                  <label for="productName" class="form-label">商品名稱</label>
                  <input
                    v-model="form.title"
                    type="text"
                    class="form-control rounded-lg"
                    id="productName"
                  />
                </div>
                <div class="row">
                  <div class="col-6 mb-3">
                    <label for="productOriginalPrice" class="form-label">原價</label>
                    <input
                      v-model="form.origin_price"
                      type="number"
                      class="form-control rounded-lg"
                      id="productOriginalPrice"
                    />
                  </div>
                  <div class="col-6 mb-3">
                    <label for="productPrice" class="form-label">售價</label>
                    <input
                      v-model="form.price"
                      type="number"
                      class="form-control rounded-lg"
                      id="productPrice"
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="col-6 mb-3">
                    <label for="productCategory" class="form-label">分類</label>
                    <input
                      v-model="form.category"
                      class="form-control rounded-lg"
                      id="productCategory"
                    />
                  </div>
                  <div class="col-6 mb-3">
                    <label for="productUnit" class="form-label">單位</label>
                    <input v-model="form.unit" class="form-control rounded-lg" id="productUnit" />
                  </div>
                </div>
                <div class="mb-3">
                  <label for="productDescription" class="form-label">商品內容</label>
                  <textarea
                    v-model="form.content"
                    class="form-control rounded-lg"
                    id="productDescription"
                    rows="4"
                  ></textarea>
                </div>
                <div class="mb-3">
                  <label for="productDescription" class="form-label">商品描述</label>
                  <textarea
                    v-model="form.description"
                    class="form-control rounded-lg"
                    id="productDescription"
                    rows="4"
                  ></textarea>
                </div>
                <div class="mb-3 d-flex align-items-center">
                  <label class="form-label me-3 mb-0">啟用</label>
                  <div class="form-check form-switch">
                    <input
                      v-model="form.is_enabled"
                      class="form-check-input"
                      type="checkbox"
                      id="flexSwitchProductEnable"
                      :true-value="1"
                      :false-value="0"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">上傳圖片 (最多 4 張)</label>

                <div class="input-group mb-2">
                  <input
                    type="url"
                    class="form-control rounded-lg"
                    placeholder="輸入圖片連結"
                    v-model="imageUrlInput"
                  />
                  <button
                    class="btn btn-outline-secondary rounded-lg ms-2"
                    type="button"
                    @click="addImageUrl"
                    :disabled="uploadedImages.length >= 4"
                  >
                    新增連結
                  </button>
                </div>

                <div class="input-group mb-2">
                  <label class="input-group-text rounded-lg" for="imageInputFile">瀏覽...</label>
                  <input
                    @change="handleFileChange"
                    type="file"
                    class="form-control d-none"
                    id="imageInputFile"
                    accept=".jpg, .jpeg, .png"
                  />
                  <div class="file-name-display form-control rounded-lg">{{ fileNameDisplay }}</div>
                  <button
                    @click="triggerUpload"
                    :disabled="!fileToUpload || isUploading || uploadedImages.length >= 4"
                    class="btn btn-outline-secondary rounded-lg ms-2"
                    type="button"
                  >
                    <span
                      v-if="isUploading"
                      class="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {{ isUploading ? '上傳中...' : '上傳圖片' }}
                  </button>
                </div>
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0">已上傳圖片</label>
                </div>

                <div id="imagesContainer" class="d-flex flex-wrap gap-2">
                  <div
                    v-for="(image, index) in uploadedImages"
                    :key="index"
                    class="image-preview-thumbnail-container"
                    :class="{ 'main-image': index === 0 }"
                  >
                    <img :src="image" class="image-preview-thumbnail" alt="商品圖片預覽" />
                    <button class="btn btn-danger btn-sm delete-btn" @click="deleteImage(index)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>

                  <div
                    v-for="i in 4 - uploadedImages.length"
                    :key="'placeholder-' + i"
                    class="image-preview-thumbnail-container"
                  >
                    <img
                      :src="`https://placehold.co/100x100/e9ecef/adb5bd?text=Image+${uploadedImages.length + i}`"
                      class="image-preview-thumbnail"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-outline-secondary rounded-lg">
            取消
          </button>
          <button
            @click="saveProduct"
            :disabled="isLoading"
            type="button"
            class="btn btn-dark rounded-lg"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
