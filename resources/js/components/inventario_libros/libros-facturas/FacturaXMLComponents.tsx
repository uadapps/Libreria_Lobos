// ============================================
// 📁 components/libros-facturas/FacturaXMLComponents.tsx
// ============================================
import React, { useCallback } from 'react';
import {
  Upload,
  FileText,
  Loader,
} from 'lucide-react';
import { DatosFactura, FacturaLibro, ConceptoFactura } from '@/types/LibroCompleto';

interface FacturaXMLProps {
  archivoXML: File | null;
  setArchivoXML: React.Dispatch<React.SetStateAction<File | null>>;
  datosFactura: DatosFactura | null;
  buscandoISBNs: boolean;
  guardando: boolean;
  onProcesarFactura: (archivo: File) => void;
  onLimpiarFactura: () => void;
}

export const FacturaXMLUploader: React.FC<FacturaXMLProps> = ({
  archivoXML,
  setArchivoXML,
  datosFactura,
  buscandoISBNs,
  guardando,
  onProcesarFactura,
}) => {
  return (
    <div className="space-y-4">
      {!datosFactura && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <input
            type="file"
            accept=".xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setArchivoXML(file);
              }
            }}
            className="hidden"
            id="xml-upload"
            disabled={buscandoISBNs || guardando}
          />
          <label htmlFor="xml-upload" className="cursor-pointer">
            <span className="text-lg font-medium text-gray-700">Subir Factura XML (CFDI)</span>
            <p className="mt-2 text-gray-500">Se enriquecerá automáticamente la información</p>
          </label>
        </div>
      )}

      {archivoXML && !datosFactura && (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="flex flex-col justify-center">
              <span className="font-medium text-blue-800">{archivoXML.name}</span>
              <p className="text-xs leading-none text-blue-600">Listo para procesar...</p>
            </div>
          </div>

          <button
            onClick={() => onProcesarFactura(archivoXML)}
            disabled={buscandoISBNs || guardando}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {buscandoISBNs ? <Loader className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Procesar Factura
          </button>
        </div>
      )}
    </div>
  );
};

export const InfoFacturaProcesada: React.FC<{
  datosFactura: DatosFactura;
  onLimpiar: () => void;
}> = ({ datosFactura, onLimpiar }) => {
  return (
    <div className="border rounded-lg p-4 bg-green-50">
      <div className="mb-2">
        <span className="font-bold">Folio:</span> {datosFactura.folio}
      </div>
      <div className="mb-2">
        <span className="font-bold">Fecha:</span> {datosFactura.fecha}
      </div>
      <div className="mb-2">
        <span className="font-bold">Editorial:</span> {datosFactura.editorial}
      </div>
      <div className="mb-2">
        <span className="font-bold">RFC:</span> {datosFactura.emisor?.rfc}
      </div>
      <div className="mb-2">
        <span className="font-bold">Total:</span> ${datosFactura.total}
      </div>
      <button
        onClick={onLimpiar}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Limpiar factura
      </button>
    </div>
  );
};

export const extraerDatosFactura = (xmlDoc: Document): { datosFactura: DatosFactura; librosExtraidos: FacturaLibro[] } => {
  const comprobante = xmlDoc.querySelector('Comprobante');
  const emisor = xmlDoc.querySelector('Emisor');
  const receptor = xmlDoc.querySelector('Receptor');
  const timbre = xmlDoc.querySelector('TimbreFiscalDigital');
  const impuestosNodo = xmlDoc.querySelector('Impuestos');
  const datosFactura: DatosFactura = {
    serie: comprobante?.getAttribute('Serie') || '',
    folio: comprobante?.getAttribute('Folio') || '',
    fecha: comprobante?.getAttribute('Fecha') || '',
    subtotal: parseFloat(comprobante?.getAttribute('SubTotal') || '0'),
    descuento: parseFloat(comprobante?.getAttribute('Descuento') || '0'),
    total: parseFloat(comprobante?.getAttribute('Total') || '0'),
    moneda: comprobante?.getAttribute('Moneda') || 'MXN',
    tipoCambio: parseFloat(comprobante?.getAttribute('TipoCambio') || '1'),
    tipoComprobante: comprobante?.getAttribute('TipoDeComprobante') || 'I',
    metodoPago: comprobante?.getAttribute('MetodoPago') || 'PPD',
    formaPago: comprobante?.getAttribute('FormaPago') || '99',
    condicionesPago: comprobante?.getAttribute('CondicionesDePago') || '',
    lugarExpedicion: comprobante?.getAttribute('LugarExpedicion') || '',
    emisor: {
      rfc: emisor?.getAttribute('Rfc') || '',
      nombre: emisor?.getAttribute('Nombre') || '',
      regimenFiscal: emisor?.getAttribute('RegimenFiscal') || '',
    },
    receptor: {
      rfc: receptor?.getAttribute('Rfc') || '',
      nombre: receptor?.getAttribute('Nombre') || '',
      usoCfdi: receptor?.getAttribute('UsoCFDI') || '',
      domicilioFiscal: receptor?.getAttribute('DomicilioFiscalReceptor') || '',
      regimenFiscal: receptor?.getAttribute('RegimenFiscalReceptor') || '',
    },
    impuestos: {
      totalImpuestosTrasladados: parseFloat(impuestosNodo?.getAttribute('TotalImpuestosTrasladados') || '0'),
      traslados: [],
    },
    editorial: '',
    numeroConceptos: 0,
    procesado: false,
  };
  if (timbre) {
    datosFactura.timbreFiscal = {
      uuid: timbre.getAttribute('UUID') || '',
      fechaTimbrado: timbre.getAttribute('FechaTimbrado') || '',
      selloCfd: timbre.getAttribute('SelloCFD') || '',
      noCertificadoSat: timbre.getAttribute('NoCertificadoSAT') || '',
      selloSat: timbre.getAttribute('SelloSAT') || '',
      rfcProvCertif: timbre.getAttribute('RfcProvCertif') || '',
    };
    datosFactura.fechaTimbrado = timbre.getAttribute('FechaTimbrado') || '';
  }
  const trasladosGlobales = xmlDoc.querySelectorAll('Impuestos > Traslados > Traslado');
  trasladosGlobales.forEach((traslado) => {
    datosFactura.impuestos.traslados.push({
      base: parseFloat(traslado.getAttribute('Base') || '0'),
      impuesto: traslado.getAttribute('Impuesto') || '',
      tipoFactor: traslado.getAttribute('TipoFactor') || '',
      tasaOCuota: parseFloat(traslado.getAttribute('TasaOCuota') || '0'),
      importe: parseFloat(traslado.getAttribute('Importe') || '0'),
    });
  });
  const conceptosNodos = xmlDoc.querySelectorAll('Concepto');
  const conceptos: ConceptoFactura[] = [];
  const librosExtraidos: FacturaLibro[] = [];

  conceptosNodos.forEach((concepto, index) => {
    const conceptoData: ConceptoFactura = {
      cantidad: parseInt(concepto.getAttribute('Cantidad') || '0'),
      claveProdServ: concepto.getAttribute('ClaveProdServ') || '',
      claveUnidad: concepto.getAttribute('ClaveUnidad') || '',
      descripcion: concepto.getAttribute('Descripcion') || '',
      noIdentificacion: concepto.getAttribute('NoIdentificacion') || '',
      objetoImp: concepto.getAttribute('ObjetoImp') || '',
      unidad: concepto.getAttribute('Unidad') || '',
      valorUnitario: parseFloat(concepto.getAttribute('ValorUnitario') || '0'),
      importe: parseFloat(concepto.getAttribute('Importe') || '0'),
      descuento: parseFloat(concepto.getAttribute('Descuento') || '0'),
    };
    const impuestosConcepto = concepto.querySelectorAll('Impuestos > Traslados > Traslado');
    if (impuestosConcepto.length > 0) {
      conceptoData.impuestos = { traslados: [] };
      impuestosConcepto.forEach((imp) => {
        conceptoData.impuestos!.traslados!.push({
          base: parseFloat(imp.getAttribute('Base') || '0'),
          impuesto: imp.getAttribute('Impuesto') || '',
          tipoFactor: imp.getAttribute('TipoFactor') || '',
          tasaOCuota: parseFloat(imp.getAttribute('TasaOCuota') || '0'),
          importe: parseFloat(imp.getAttribute('Importe') || '0'),
        });
      });
    }

    conceptos.push(conceptoData);
    const { titulo, autor } = extraerTituloYAutor(conceptoData.descripcion);
    const esLibro =
      conceptoData.claveProdServ.startsWith('5510') ||
      conceptoData.descripcion.toLowerCase().includes('libro') ||
      conceptoData.noIdentificacion.match(/^97[89]\d{10}$/);

    if (esLibro || conceptoData.noIdentificacion || titulo) {
      librosExtraidos.push({
        isbn: conceptoData.noIdentificacion || `SIN-ISBN-${index}`,
        titulo: titulo || conceptoData.descripcion,
        autor: autor,
        cantidad: conceptoData.cantidad,
        valorUnitario: conceptoData.valorUnitario,
        descuento: conceptoData.descuento || 0,
        total: conceptoData.importe,
        editorial: datosFactura.emisor.nombre,
        fechaFactura: datosFactura.fecha,
        folio: `${datosFactura.serie}${datosFactura.folio}`,
        clave_prodserv: conceptoData.claveProdServ,
        unidad: conceptoData.unidad,
        claveUnidad: conceptoData.claveUnidad,
        rfcProveedor: datosFactura.emisor.rfc,
        regimenFiscalProveedor: datosFactura.emisor.regimenFiscal,
        uuid: datosFactura.timbreFiscal?.uuid,
        metodoPago: datosFactura.metodoPago,
        formaPago: datosFactura.formaPago,
        usoCfdi: datosFactura.receptor.usoCfdi,
        impuestos: conceptoData.impuestos?.traslados?.[0]?.importe || 0,
        tasaImpuesto: conceptoData.impuestos?.traslados?.[0]?.tasaOCuota || 0,
      });
    }
  });
  return { datosFactura, librosExtraidos };
};

export const extraerTituloYAutor = (descripcion: string): { titulo: string; autor?: string } => {
  const patrones = [
    /^LIBRO:\s*(.+?)\s*-\s*(.+)$/i,
    /^(.+?)\s+por\s+(.+)$/i,
    /^(.+?)\s*\/\s*(.+)$/i,
    /^(.+?),\s*(.+)$/i,
    /^(.+?)\s*-\s*(.+)$/i
  ];

  for (const patron of patrones) {
    const match = descripcion.match(patron);
    if (match) {
      const parte1 = match[1].trim();
      const parte2 = match[2].trim();

      if (pareceNombrePersona(parte1) && !pareceNombrePersona(parte2)) {
        return { titulo: parte2, autor: parte1 };
      } else {
        return { titulo: parte1, autor: parte2 };
      }
    }
  }

  return { titulo: descripcion.trim() };
};

export const pareceNombrePersona = (texto: string): boolean => {
  const palabras = texto.split(' ');
  return palabras.length >= 2 && palabras.length <= 4 &&
         palabras.every((palabra) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(palabra));
};
export const useFacturaXMLProcessor = () => {
  const procesarFacturaXML = useCallback(async (
    file: File,
    setBuscandoISBNs: (value: boolean) => void,
    setProgresoBusqueda: (value: { actual: number; total: number } | null) => void,
    setDatosFactura: (value: DatosFactura) => void,
    setEstadisticasBusqueda: (value: unknown) => void,
    enriquecerLibrosConBaseDatos: (libros: FacturaLibro[], datos: DatosFactura) => Promise<void>,
    setArchivoXML: (value: File | null) => void
  ) => {
    try {
      setBuscandoISBNs(true);
      setProgresoBusqueda(null);

      const texto = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(texto, 'text/xml');
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('El archivo XML no es válido');
      }
      const { datosFactura, librosExtraidos } = extraerDatosFactura(xmlDoc);

      if (librosExtraidos.length === 0) {
        throw new Error('No se encontraron libros en esta factura');
      }
      const datosFacturaCompletos = {
        folio: `${datosFactura.serie}${datosFactura.folio}`,
        fecha: datosFactura.fecha,
        editorial: datosFactura.emisor.nombre,
        rfc: datosFactura.emisor.rfc,
        numeroConceptos: librosExtraidos.length,
        procesado: true,
        uuid: datosFactura.timbreFiscal?.uuid,
        serie: datosFactura.serie,
        subtotal: datosFactura.subtotal,
        descuento: datosFactura.descuento,
        total: datosFactura.total,
        metodoPago: datosFactura.metodoPago,
        formaPago: datosFactura.formaPago,
        condicionesPago: datosFactura.condicionesPago,
        moneda: datosFactura.moneda,
        tipoCambio: datosFactura.tipoCambio,
        datosCompletos: datosFactura,
      };

      setDatosFactura(datosFacturaCompletos as DatosFactura);
      setEstadisticasBusqueda({
        total: librosExtraidos.length,
        encontrados: 0,
        noEncontrados: 0,
        tablasNuevas: 0,
        tablasViejas: 0,
        apisExternas: 0,
        isbnsOriginales: librosExtraidos.map((l) => l.isbn),
        ultimaActualizacion: new Date(),
      });

      await enriquecerLibrosConBaseDatos(librosExtraidos, datosFactura);
      setArchivoXML(null);

    } catch (error) {
      console.error('Error procesando factura');
      throw error;
    } finally {
      setBuscandoISBNs(false);
      setProgresoBusqueda(null);
    }
  }, []);

  return { procesarFacturaXML };
};
