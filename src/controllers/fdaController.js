const axios = require('axios');
const { validationResult } = require('express-validator');
const DrugSearch = require('../models/DrugSearch');

// OpenFDA API base URL
const FDA_BASE_URL = 'https://api.fda.gov';
const API_KEY = process.env.FDA_API_KEY || 'ymXaOdHfXpnQH3DjjflMVTMQZpT4aw7jcJ5P9KwR';

/**
 * İlaç araması yapan fonksiyon
 * @route GET /api/fda/drugs
 * @param {string} q - Arama sorgusu (örn: "aspirin")
 * @param {number} limit - Döndürülecek sonuç sayısı (varsayılan: 10)
 */
exports.searchDrugs = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Arama sorgusu gereklidir' });
    }

    // API isteği yapma
    const response = await axios.get(`${FDA_BASE_URL}/drug/label.json`, {
      params: {
        search: `openfda.generic_name:"${q}" OR openfda.brand_name:"${q}" OR openfda.substance_name:"${q}"`,
        limit: limit,
        api_key: API_KEY
      }
    });

    // Arama kaydını veritabanına ekleme
    if (req.user) {
      const search = new DrugSearch({
        userId: req.user.id,
        query: q,
        resultCount: response.data.meta.results.total || 0
      });
      await search.save();
    }

    // Yanıtları yapılandırma
    const drugs = response.data.results.map(drug => {
      return {
        id: drug.id || drug.openfda.application_number?.[0] || null,
        brandName: drug.openfda.brand_name?.[0] || null,
        genericName: drug.openfda.generic_name?.[0] || null,
        manufacturerName: drug.openfda.manufacturer_name?.[0] || null,
        activeIngredients: drug.active_ingredient || null,
        dosageForm: drug.dosage_form?.[0] || null,
        route: drug.openfda.route?.[0] || null,
        description: drug.description?.[0] || null
      };
    });

    res.json({
      success: true,
      total: response.data.meta.results.total || drugs.length,
      drugs: drugs
    });
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Arama sonucu bulunamadı' });
    }
    next(error);
  }
};

/**
 * İlaç detaylarını getiren fonksiyon
 * @route GET /api/fda/drugs/:drugId
 * @param {string} drugId - İlaç ID'si veya application numarası
 */
exports.getDrugDetails = async (req, res, next) => {
  try {
    const { drugId } = req.params;
    
    const response = await axios.get(`${FDA_BASE_URL}/drug/label.json`, {
      params: {
        search: `openfda.application_number:"${drugId}" OR id:"${drugId}"`,
        limit: 1,
        api_key: API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ message: 'İlaç bulunamadı' });
    }

    const drug = response.data.results[0];
    
    // Daha detaylı bilgi döndürme
    const drugDetails = {
      id: drug.id || drug.openfda.application_number?.[0] || null,
      brandName: drug.openfda.brand_name?.[0] || null,
      genericName: drug.openfda.generic_name?.[0] || null,
      manufacturerName: drug.openfda.manufacturer_name?.[0] || null,
      activeIngredients: drug.active_ingredient || null,
      dosageForm: drug.dosage_form?.[0] || null,
      route: drug.openfda.route?.[0] || null,
      description: drug.description?.[0] || null,
      indications: drug.indications_and_usage || null,
      warnings: drug.warnings || null,
      contraindications: drug.contraindications || null,
      adverseReactions: drug.adverse_reactions || null,
      drugInteractions: drug.drug_interactions || null,
      dosageAdministration: drug.dosage_and_administration || null
    };

    res.json({
      success: true,
      drug: drugDetails
    });
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'İlaç bulunamadı' });
    }
    next(error);
  }
};

/**
 * İlaç yan etki raporlarını getiren fonksiyon
 * @route GET /api/fda/adverse-events
 * @param {string} drug - İlaç adı
 * @param {number} limit - Döndürülecek sonuç sayısı (varsayılan: 10)
 */
exports.getAdverseEvents = async (req, res, next) => {
  try {
    const { drug, limit = 10 } = req.query;
    
    if (!drug) {
      return res.status(400).json({ message: 'İlaç adı gereklidir' });
    }

    const response = await axios.get(`${FDA_BASE_URL}/drug/event.json`, {
      params: {
        search: `patient.drug.medicinalproduct:"${drug}" OR patient.drug.openfda.generic_name:"${drug}" OR patient.drug.openfda.brand_name:"${drug}"`,
        limit: limit,
        api_key: API_KEY
      }
    });

    const events = response.data.results.map(event => {
      return {
        reportId: event.safetyreportid || null,
        receiveDate: event.receivedate || null,
        seriousness: event.serious || null,
        patientAge: event.patient?.patientonsetage || null,
        patientSex: event.patient?.patientsex || null,
        reactions: event.patient?.reaction?.map(r => ({
          reactionName: r.reactionmeddrapt || null,
          outcome: r.reactionoutcome || null
        })) || [],
        drugs: event.patient?.drug?.map(d => ({
          name: d.medicinalproduct || null,
          indication: d.drugindication || null,
          dosage: d.drugdosagetext || null
        })) || []
      };
    });

    res.json({
      success: true,
      total: response.data.meta.results.total || events.length,
      events: events
    });
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Yan etki raporu bulunamadı' });
    }
    next(error);
  }
};

/**
 * İlaç geri çağırma bildirimlerini getiren fonksiyon
 * @route GET /api/fda/drug-recalls
 * @param {string} drug - İlaç adı (opsiyonel)
 * @param {number} limit - Döndürülecek sonuç sayısı (varsayılan: 10)
 */
exports.getDrugRecalls = async (req, res, next) => {
  try {
    const { drug, limit = 10 } = req.query;
    
    let searchParam = '';
    if (drug) {
      searchParam = `product_description:"${drug}" OR reason_for_recall:"${drug}"`;
    }

    const response = await axios.get(`${FDA_BASE_URL}/drug/enforcement.json`, {
      params: {
        search: searchParam || undefined,
        limit: limit,
        api_key: API_KEY
      }
    });

    const recalls = response.data.results.map(recall => {
      return {
        recallId: recall.recall_number || null,
        recallInitiationDate: recall.recall_initiation_date || null,
        product: recall.product_description || null,
        reason: recall.reason_for_recall || null,
        status: recall.status || null,
        classification: recall.classification || null,
        company: recall.recalling_firm || null,
        country: recall.country || null,
        distributionPattern: recall.distribution_pattern || null
      };
    });

    res.json({
      success: true,
      total: response.data.meta.results.total || recalls.length,
      recalls: recalls
    });
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Geri çağırma bildirimi bulunamadı' });
    }
    next(error);
  }
}; 