import { DatabaseSearchService } from '@/services/ISBN/DatabaseSearchService';
import { DatosFactura, FacturaLibro, LibroCompleto } from '@/types/LibroCompleto';
import { useCallback } from 'react';
import { toast } from 'react-toastify';

export const useEnriquecimientoBD = (
    setLibros: React.Dispatch<React.SetStateAction<LibroCompleto[]>>,
    setProgresoBusqueda: React.Dispatch<React.SetStateAction<{ actual: number; total: number } | null>>,
    setEstadisticasBusqueda: React.Dispatch<React.SetStateAction<unknown>>,
) => {
    const enriquecerLibrosConBaseDatos = useCallback(
        async (librosBasicos: FacturaLibro[], datosFactura: DatosFactura) => {
            const isbns = librosBasicos.map((libro) => libro.isbn);
            const titulos = librosBasicos.map((libro) => libro.titulo);
            try {
                const librosEnriquecidos = await DatabaseSearchService.procesarLoteISBNs(
                    isbns,
                    (actual, total) => {
                        setProgresoBusqueda({ actual, total });            
                    },
                    titulos,
                    {},
                );
                if (librosEnriquecidos.length !== librosBasicos.length) {
                    throw new Error(`Mismatch en número de resultados: enviados ${librosBasicos.length}, recibidos ${librosEnriquecidos.length}`);
                }
                const librosCompletos: LibroCompleto[] = [];
                const stats = {
                    encontrados: 0,
                    noEncontrados: 0,
                    tablasNuevas: 0,
                    tablasViejas: 0,
                    apisExternas: 0,
                };

                for (let index = 0; index < librosBasicos.length; index++) {
                    const libroBasico = librosBasicos[index];
                    const libroEnriquecido = librosEnriquecidos[index];
                    if (libroEnriquecido) {
                        stats.encontrados++;
                        if (libroEnriquecido.fuente?.includes('LB_') || libroEnriquecido.fuente?.includes('TABLAS_NUEVAS')) {
                            stats.tablasNuevas++;
                        } else if (libroEnriquecido.fuente?.includes('legacy') || libroEnriquecido.fuente?.includes('TABLAS_VIEJAS')) {
                            stats.tablasViejas++;
                        } else if (libroEnriquecido.fuente?.includes('APIS_EXTERNAS')) {
                            stats.apisExternas++;
                        }
                        const libroCompleto: LibroCompleto = {
                            ...libroEnriquecido,
                            id: `factura-${index}`,
                            cantidad: libroBasico.cantidad,
                            valorUnitario: libroBasico.valorUnitario,
                            descuento: libroBasico.descuento,
                            total: libroBasico.total,
                            fechaFactura: datosFactura.fecha,
                            folio: datosFactura.folio,
                            estado: 'procesado',
                        };

                        librosCompletos.push(libroCompleto);
                    } else {
                        stats.noEncontrados++;
                        const libroCompleto: LibroCompleto = {
                            id: `factura-${index}`,
                            isbn: libroBasico.isbn,
                            titulo: libroBasico.titulo,
                            cantidad: libroBasico.cantidad,
                            valorUnitario: libroBasico.valorUnitario,
                            descuento: libroBasico.descuento,
                            total: libroBasico.total,
                            autor: {
                                nombre: libroBasico.autor || 'Autor Desconocido',
                                apellidos: '',
                            },
                            editorial: { nombre: datosFactura.editorial || 'Editorial Desconocida' },
                            genero: { nombre: 'General' },
                            fechaFactura: datosFactura.fecha,
                            folio: datosFactura.folio,
                            estado: 'error',
                            errorMsg: 'No se encontró en base de datos',
                            fuente: 'Factura únicamente',
                        };

                        librosCompletos.push(libroCompleto);
                    }
                }
                setEstadisticasBusqueda((prev: unknown) =>
                    prev
                        ? {
                              ...prev,
                              encontrados: stats.encontrados,
                              noEncontrados: stats.noEncontrados,
                              tablasNuevas: stats.tablasNuevas,
                              tablasViejas: stats.tablasViejas,
                              apisExternas: stats.apisExternas,
                              ultimaActualizacion: new Date(),
                          }
                        : null,
                );

                setLibros((prev) => [...prev, ...librosCompletos]);
            } catch {
                toast.error('Error conectando con la base de datos. Verifique la conexión.', {
                    position: 'top-center',
                    autoClose: 7000,
                    theme: 'colored',
                });
            }
        },
        [setLibros, setProgresoBusqueda, setEstadisticasBusqueda],
    );

    return {
        enriquecerLibrosConBaseDatos,
    };
};
