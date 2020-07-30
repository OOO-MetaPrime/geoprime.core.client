'use strict'

import CryptoPro from 'crypto-pro'
import base64js from 'base64-js'
import { ResultObject } from './resultObject'

const gost34112012 = '1.2.643.7'
const gost34102001 = '1.2.643.2'

async function getIssuerName (certificate) {
  const issuerInfo = await certificate.getIssuerInfo()

  return issuerInfo.find(x => x.title === 'Удостоверяющий центр').descr
}

async function getOwnerName (certificate) {
  const issuerInfo = await certificate.getOwnerInfo()

  return issuerInfo.find(x => x.title === 'Владелец').descr
}

async function getCertificateList () {
  const certList = await CryptoPro.call('getCertsList')
  const availableCertificates = []
  for (const cert of certList) {
    const algorithm = await cert.getAlgorithm()
    if (algorithm.oid.indexOf(gost34112012) !== 0 &&
        algorithm.oid.indexOf(gost34102001) !== 0) {
      continue
    }
    availableCertificates.push({
      subjectName: await getOwnerName(cert),
      issuerName: await getIssuerName(cert),
      thumbprint: cert.thumbprint,
      _cert: cert._cert,
      algorithm,
      algorithmId: algorithm.oid,
      validFrom: cert.validFrom,
      validTo: cert.validTo
    })
  }
  return availableCertificates
}

async function signXml (certificate, xmlData) {
  const xmlByteArray = new TextEncoder('utf-8').encode(xmlData)

  const signedData = await CryptoPro.call('signData', certificate.thumbprint, base64js.fromByteArray(xmlByteArray))
  return signedData
}

async function signObject (certificate, data) {
  let signedData = null
  const xmlByteArray = new TextEncoder('utf-8').encode(data)
  try {
    signedData = await CryptoPro.call('signData', certificate.thumbprint, base64js.fromByteArray(xmlByteArray))
  } catch (err) {
    return new ResultObject(err, err, null)
  }
  return new ResultObject(null, 'Данные успешно подписаны', signedData)
}

async function getSystemInfo () {
  let systemInfo = null
  try {
    systemInfo = await CryptoPro.call('getSystemInfo')
  } catch (err) {
    return new ResultObject(err, err, null)
  }
  return new ResultObject(null, 'Системная информация успешно получена', systemInfo)
}

async function getCertificateListObject () {
  let certificates = null
  try {
    certificates = await getCertificateList()
  } catch (err) {
    return new ResultObject(err, err, null)
  }
  return new ResultObject(null, 'Список сертификатов успешно получен', certificates)
}
export default {
  getCertificateList,
  signXml,
  getSystemInfo,
  getCertificateListObject,
  signObject
}
