import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig<D = any> {
    omitGraphToken?: boolean
    graphRequired?: boolean
  }
}


