import axios from 'axios'
import { downloadFilePost } from '^/utils/download'

export default {
  /**
   * Получить список шаблонов печати по реестру.
   */
  async getTemplates (reportId, options) {
    const { data } = await axios.get(`/api/report-templates/${reportId}`, {
      params: options
    })
    return data
  },

  /**
   * Скачать сформированный на основании шаблона печати файл.
   */
  async printTemplate (reportTemplateId, options) {
    if (reportTemplateId) {
      await downloadFilePost(`/api/report-templates/${reportTemplateId}/print`, options)
    }
  }
}
