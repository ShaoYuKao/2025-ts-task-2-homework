// ==========================================
// TypeScript 練習題目 - 商品 API 請求函式
// ==========================================

// 🎯 練習目標：
// 1. 學習函式型別定義
// 2. 理解泛型 (Generic) 的使用
// 3. 熟悉 Promise 和 AxiosResponse 的型別

// 📝 練習說明：
// 請為以下函式加上正確的 TypeScript 型別註解
// 提示：需要從 @/types/product 匯入相關型別

// TODO: 匯入型別定義
// 提示：需要匯入 CreateProductParams, CreateProductResponse 等型別
import type {
  CreateProductParams,
  CreateProductResponse,
  EditProductParams,
  EditProductResponse,
  DeleteProductResponse,
  GetProductsResponse,
  UploadImageResponse,
} from '@/types/product'
import type { AxiosResponse } from 'axios'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BASE_URL
const API_PATH = import.meta.env.VITE_API_PATH

const productApi = axios.create({
  baseURL: BASE_URL,
})

productApi.interceptors.request.use(
  (request) => {
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/, '$1')

    if (token) {
      request.headers['Authorization'] = token
    }

    return request
  },
  (error) => {
    return Promise.reject(error)
  },
)

productApi.interceptors.response.use(
  (response) => {
    return Promise.resolve(response)
  },
  (error) => {
    return Promise.reject(error.response.data)
  },
)

// TODO: 為 apiGetProducts 函式加上型別註解
// 提示：
// - 參數 params 是一個物件，包含可選的 page 和 category 屬性（都是字串）
// - 回傳值是 Promise<AxiosResponse<GetProductsResponse>>
export const apiGetProducts = (params: {
  page?: string
  category?: string
}): Promise<AxiosResponse<GetProductsResponse>> =>
  productApi.get(`/v2/api/${API_PATH}/admin/products`, {
    params,
  })

// TODO: 為 apiCreateProduct 函式加上型別註解
// 提示：
// - 參數 params 的型別是 CreateProductParams
// - 回傳值是 Promise<AxiosResponse<CreateProductResponse>>
export const apiCreateProduct = (
  params: CreateProductParams
): Promise<AxiosResponse<CreateProductResponse>> =>
  productApi.post(`/v2/api/${API_PATH}/admin/product`, {
    data: params,
  })

// TODO: 為 apiEditProduct 函式加上型別註解
// 提示：
// - 參數 params 的型別是 EditProductParams
// - 回傳值是 Promise<AxiosResponse<EditProductResponse>>
export const apiEditProduct = (
  params: EditProductParams
): Promise<AxiosResponse<EditProductResponse>> => {
  const { data, id } = params
  return productApi.put(`/v2/api/${API_PATH}/admin/product/${id}`, {
    data,
  })
}

// TODO: 為 apiDeleteProduct 函式加上型別註解
// 提示：
// - 參數 productId 是字串型別
// - 回傳值是 Promise<AxiosResponse<DeleteProductResponse>>
export const apiDeleteProduct = (
  productId: string
): Promise<AxiosResponse<DeleteProductResponse>> =>
  productApi.delete(`/v2/api/${API_PATH}/admin/product/${productId}`)

// TODO: 為 apiUploadImage 函式加上型別註解
// 提示：
// - 參數 file 是 FormData 型別
// - 回傳值是 Promise<AxiosResponse<UploadImageResponse>>
// - 這是一個 async 函式
export const apiUploadImage = async (
  file: FormData
): Promise<AxiosResponse<UploadImageResponse>> =>
  productApi.post(`/v2/api/${API_PATH}/admin/upload`, file)
