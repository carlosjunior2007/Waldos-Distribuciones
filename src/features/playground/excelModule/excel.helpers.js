import { DEFAULT_COLUMNS, DEFAULT_ROWS } from './excel.constants';


export const EXCEL_FORMULA_CATALOG = [
  { name: 'SUM', alias: 'SUMA', syntax: 'SUM(number1, [number2], ...)', description: 'Suma números o rangos.' },
  { name: 'AVERAGE', alias: 'PROMEDIO', syntax: 'AVERAGE(number1, [number2], ...)', description: 'Promedia números o rangos.' },
  { name: 'MIN', syntax: 'MIN(number1, [number2], ...)', description: 'Devuelve el valor menor.' },
  { name: 'MAX', syntax: 'MAX(number1, [number2], ...)', description: 'Devuelve el valor mayor.' },
  { name: 'COUNT', alias: 'CONTAR', syntax: 'COUNT(value1, [value2], ...)', description: 'Cuenta valores numéricos.' },
  { name: 'COUNTA', alias: 'CONTARA', syntax: 'COUNTA(value1, [value2], ...)', description: 'Cuenta celdas no vacías.' },
  { name: 'IF', alias: 'SI', syntax: 'IF(condition, true_value, false_value)', description: 'Devuelve un valor según una condición.' },
  { name: 'IFS', alias: 'SI.CONJUNTO', syntax: 'IFS(condition1, value1, ...)', description: 'Evalúa varias condiciones en orden.' },
  { name: 'IFERROR', alias: 'SI.ERROR', syntax: 'IFERROR(value, fallback)', description: 'Devuelve un respaldo si hay error.' },
  { name: 'SUMIF', alias: 'SUMAR.SI', syntax: 'SUMIF(range, criteria, [sum_range])', description: 'Suma valores que cumplen un criterio.' },
  { name: 'SUMIFS', alias: 'SUMAR.SI.CONJUNTO', syntax: 'SUMIFS(sum_range, criteria_range1, criteria1, ...)', description: 'Suma usando múltiples criterios.' },
  { name: 'COUNTIF', alias: 'CONTAR.SI', syntax: 'COUNTIF(range, criteria)', description: 'Cuenta valores que cumplen un criterio.' },
  { name: 'COUNTIFS', alias: 'CONTAR.SI.CONJUNTO', syntax: 'COUNTIFS(range1, criteria1, ...)', description: 'Cuenta usando múltiples criterios.' },
  { name: 'AVERAGEIF', alias: 'PROMEDIO.SI', syntax: 'AVERAGEIF(range, criteria, [average_range])', description: 'Promedia valores que cumplen un criterio.' },
  { name: 'AVERAGEIFS', alias: 'PROMEDIO.SI.CONJUNTO', syntax: 'AVERAGEIFS(avg_range, criteria_range1, criteria1, ...)', description: 'Promedia usando múltiples criterios.' },
  { name: 'MAXIFS', syntax: 'MAXIFS(max_range, criteria_range1, criteria1, ...)', description: 'Máximo usando criterios.' },
  { name: 'MINIFS', syntax: 'MINIFS(min_range, criteria_range1, criteria1, ...)', description: 'Mínimo usando criterios.' },
  { name: 'ROUND', alias: 'REDONDEAR', syntax: 'ROUND(number, digits)', description: 'Redondea a cierta cantidad de decimales.' },
  { name: 'ROUNDUP', alias: 'REDONDEAR.MAS', syntax: 'ROUNDUP(number, digits)', description: 'Redondea hacia arriba.' },
  { name: 'ROUNDDOWN', alias: 'REDONDEAR.MENOS', syntax: 'ROUNDDOWN(number, digits)', description: 'Redondea hacia abajo.' },
  { name: 'ABS', syntax: 'ABS(number)', description: 'Valor absoluto.' },
  { name: 'SQRT', alias: 'RAIZ', syntax: 'SQRT(number)', description: 'Raíz cuadrada.' },
  { name: 'POWER', alias: 'POTENCIA', syntax: 'POWER(number, power)', description: 'Potencia.' },
  { name: 'MOD', syntax: 'MOD(number, divisor)', description: 'Residuo de división.' },
  { name: 'MROUND', alias: 'MULTIPLO.REDONDEAR', syntax: 'MROUND(number, multiple)', description: 'Redondea al múltiplo más cercano.' },
  { name: 'CEILING', alias: 'TECHO', syntax: 'CEILING(number, significance)', description: 'Redondea hacia arriba al múltiplo indicado.' },
  { name: 'FLOOR', alias: 'PISO', syntax: 'FLOOR(number, significance)', description: 'Redondea hacia abajo al múltiplo indicado.' },
  { name: 'EVEN', alias: 'PAR', syntax: 'EVEN(number)', description: 'Redondea al entero par superior.' },
  { name: 'ODD', alias: 'IMPAR', syntax: 'ODD(number)', description: 'Redondea al entero impar superior.' },
  { name: 'SIGN', alias: 'SIGNO', syntax: 'SIGN(number)', description: 'Devuelve -1, 0 o 1.' },
  { name: 'MEDIAN', alias: 'MEDIANA', syntax: 'MEDIAN(number1, [number2], ...)', description: 'Mediana.' },
  { name: 'MODE', alias: 'MODA', syntax: 'MODE(number1, [number2], ...)', description: 'Moda.' },
  { name: 'RANK', alias: 'JERARQUIA', syntax: 'RANK(number, ref, [order])', description: 'Posición de un número dentro de una lista.' },
  { name: 'PERCENTILE', alias: 'PERCENTIL', syntax: 'PERCENTILE(array, k)', description: 'Percentil de un conjunto.' },
  { name: 'QUARTILE', alias: 'CUARTIL', syntax: 'QUARTILE(array, quart)', description: 'Cuartil de un conjunto.' },
  { name: 'VLOOKUP', alias: 'BUSCARV', syntax: 'VLOOKUP(value, table, col_index, [approx])', description: 'Busca verticalmente.' },
  { name: 'HLOOKUP', alias: 'BUSCARH', syntax: 'HLOOKUP(value, table, row_index, [approx])', description: 'Busca horizontalmente.' },
  { name: 'XLOOKUP', alias: 'BUSCARX', syntax: 'XLOOKUP(value, lookup_array, return_array, [not_found])', description: 'Busca en un rango y devuelve otro valor.' },
  { name: 'INDEX', alias: 'INDICE', syntax: 'INDEX(range, row, [column])', description: 'Devuelve un valor por posición.' },
  { name: 'MATCH', alias: 'COINCIDIR', syntax: 'MATCH(value, range, [type])', description: 'Devuelve la posición de un valor.' },
  { name: 'CHOOSE', alias: 'ELEGIR', syntax: 'CHOOSE(index, value1, value2, ...)', description: 'Elige un valor por índice.' },
  { name: 'SWITCH', alias: 'CAMBIAR', syntax: 'SWITCH(expression, value1, result1, ..., default)', description: 'Compara un valor contra varios casos.' },
  { name: 'CONCAT', alias: 'CONCATENAR', syntax: 'CONCAT(text1, [text2], ...)', description: 'Une textos.' },
  { name: 'TEXTJOIN', alias: 'UNIRCADENAS', syntax: 'TEXTJOIN(delimiter, ignore_empty, text1, ...)', description: 'Une textos usando separador.' },
  { name: 'LEFT', alias: 'IZQUIERDA', syntax: 'LEFT(text, count)', description: 'Toma caracteres de la izquierda.' },
  { name: 'RIGHT', alias: 'DERECHA', syntax: 'RIGHT(text, count)', description: 'Toma caracteres de la derecha.' },
  { name: 'MID', alias: 'EXTRAE', syntax: 'MID(text, start, count)', description: 'Extrae texto desde una posición.' },
  { name: 'LEN', alias: 'LARGO', syntax: 'LEN(text)', description: 'Longitud del texto.' },
  { name: 'TRIM', alias: 'ESPACIOS', syntax: 'TRIM(text)', description: 'Limpia espacios extra.' },
  { name: 'UPPER', alias: 'MAYUSC', syntax: 'UPPER(text)', description: 'Convierte a mayúsculas.' },
  { name: 'LOWER', alias: 'MINUSC', syntax: 'LOWER(text)', description: 'Convierte a minúsculas.' },
  { name: 'PROPER', alias: 'NOMPROPIO', syntax: 'PROPER(text)', description: 'Convierte a nombre propio.' },
  { name: 'SUBSTITUTE', alias: 'SUSTITUIR', syntax: 'SUBSTITUTE(text, old, new, [instance])', description: 'Sustituye texto.' },
  { name: 'REPLACE', alias: 'REEMPLAZAR', syntax: 'REPLACE(text, start, count, new_text)', description: 'Reemplaza parte del texto.' },
  { name: 'FIND', alias: 'ENCONTRAR', syntax: 'FIND(find_text, within_text, [start])', description: 'Busca texto exacto.' },
  { name: 'SEARCH', alias: 'HALLAR', syntax: 'SEARCH(find_text, within_text, [start])', description: 'Busca texto sin distinguir mayúsculas.' },
  { name: 'TODAY', alias: 'HOY', syntax: 'TODAY()', description: 'Fecha actual.' },
  { name: 'NOW', alias: 'AHORA', syntax: 'NOW()', description: 'Fecha y hora actual.' },
  { name: 'DATE', alias: 'FECHA', syntax: 'DATE(year, month, day)', description: 'Crea una fecha.' },
  { name: 'EDATE', alias: 'FECHA.MES', syntax: 'EDATE(start_date, months)', description: 'Suma meses a una fecha.' },
  { name: 'EOMONTH', alias: 'FIN.MES', syntax: 'EOMONTH(start_date, months)', description: 'Último día del mes desplazado.' },
  { name: 'WEEKDAY', alias: 'DIASEM', syntax: 'WEEKDAY(date, [type])', description: 'Día de la semana.' },
  { name: 'WEEKNUM', alias: 'NUM.DE.SEMANA', syntax: 'WEEKNUM(date)', description: 'Número de semana aproximado.' },
  { name: 'HOUR', alias: 'HORA', syntax: 'HOUR(time)', description: 'Hora.' },
  { name: 'MINUTE', alias: 'MINUTO', syntax: 'MINUTE(time)', description: 'Minuto.' },
  { name: 'SECOND', alias: 'SEGUNDO', syntax: 'SECOND(time)', description: 'Segundo.' },
  { name: 'AND', alias: 'Y', syntax: 'AND(condition1, condition2, ...)', description: 'Todas las condiciones deben ser verdaderas.' },
  { name: 'OR', alias: 'O', syntax: 'OR(condition1, condition2, ...)', description: 'Alguna condición debe ser verdadera.' },
  { name: 'NOT', alias: 'NO', syntax: 'NOT(condition)', description: 'Invierte un valor lógico.' },
  { name: 'ISBLANK', alias: 'ESBLANCO', syntax: 'ISBLANK(value)', description: 'Comprueba si está vacío.' },
  { name: 'ISNUMBER', alias: 'ESNUMERO', syntax: 'ISNUMBER(value)', description: 'Comprueba si es número.' },
  { name: 'ISTEXT', alias: 'ESTEXTO', syntax: 'ISTEXT(value)', description: 'Comprueba si es texto.' },
  { name: 'ISERROR', alias: 'ESERROR', syntax: 'ISERROR(value)', description: 'Comprueba si es error.' },
  { name: 'PMT', alias: 'PAGO', syntax: 'PMT(rate, nper, pv, [fv], [type])', description: 'Pago de préstamo.' },

  { name: 'PV', alias: 'VA', syntax: 'PV(rate, nper, pmt, [fv], [type])', description: 'Valor presente de pagos futuros.' },
  { name: 'FV', alias: 'VF', syntax: 'FV(rate, nper, pmt, [pv], [type])', description: 'Valor futuro de una inversión o préstamo.' },
  { name: 'NPER', alias: 'NPER', syntax: 'NPER(rate, pmt, pv, [fv], [type])', description: 'Número de periodos necesarios.' },
  { name: 'RATE', alias: 'TASA', syntax: 'RATE(nper, pmt, pv, [fv], [type], [guess])', description: 'Tasa de interés por periodo.' },
  { name: 'IPMT', alias: 'PAGOINT', syntax: 'IPMT(rate, per, nper, pv, [fv], [type])', description: 'Parte de interés de un pago.' },
  { name: 'PPMT', alias: 'PAGOPRIN', syntax: 'PPMT(rate, per, nper, pv, [fv], [type])', description: 'Parte de capital de un pago.' },
  { name: 'CUMIPMT', alias: 'PAGO.INT.ENTRE', syntax: 'CUMIPMT(rate, nper, pv, start_period, end_period, type)', description: 'Interés acumulado entre periodos.' },
  { name: 'CUMPRINC', alias: 'PAGO.PRINC.ENTRE', syntax: 'CUMPRINC(rate, nper, pv, start_period, end_period, type)', description: 'Capital acumulado entre periodos.' },
  { name: 'NPV', alias: 'VNA', syntax: 'NPV(rate, value1, [value2], ...)', description: 'Valor presente neto de flujos periódicos.' },
  { name: 'IRR', alias: 'TIR', syntax: 'IRR(values, [guess])', description: 'Tasa interna de retorno.' },
  { name: 'MIRR', alias: 'TIRM', syntax: 'MIRR(values, finance_rate, reinvest_rate)', description: 'Tasa interna de retorno modificada.' },
  { name: 'SLN', alias: 'SLN', syntax: 'SLN(cost, salvage, life)', description: 'Depreciación lineal.' },
  { name: 'SYD', alias: 'SYD', syntax: 'SYD(cost, salvage, life, period)', description: 'Depreciación por suma de dígitos.' },
  { name: 'DDB', alias: 'DDB', syntax: 'DDB(cost, salvage, life, period, [factor])', description: 'Depreciación de doble saldo decreciente.' },
  { name: 'DB', alias: 'DB', syntax: 'DB(cost, salvage, life, period, [month])', description: 'Depreciación de saldo fijo aproximada.' },
  { name: 'EFFECT', alias: 'INT.EFECTIVO', syntax: 'EFFECT(nominal_rate, npery)', description: 'Tasa efectiva anual.' },
  { name: 'NOMINAL', alias: 'TASA.NOMINAL', syntax: 'NOMINAL(effect_rate, npery)', description: 'Tasa nominal anual.' },
  { name: 'RRI', alias: 'RRI', syntax: 'RRI(nper, pv, fv)', description: 'Tasa equivalente de crecimiento.' },
  { name: 'PDURATION', alias: 'DURACION.P', syntax: 'PDURATION(rate, pv, fv)', description: 'Periodos para llegar a un valor futuro.' },
  { name: 'FVSCHEDULE', alias: 'VF.PLAN', syntax: 'FVSCHEDULE(principal, schedule)', description: 'Valor futuro con tasas variables.' },
  { name: 'DAYS360', alias: 'DIAS360', syntax: 'DAYS360(start_date, end_date)', description: 'Días entre fechas con año comercial de 360 días.' },
  { name: 'NETWORKDAYS', alias: 'DIAS.LAB', syntax: 'NETWORKDAYS(start_date, end_date, [holidays])', description: 'Días hábiles entre fechas.' },
  { name: 'WORKDAY', alias: 'DIA.LAB', syntax: 'WORKDAY(start_date, days, [holidays])', description: 'Fecha después de sumar días hábiles.' },
  { name: 'YEARFRAC', alias: 'FRAC.AÑO', syntax: 'YEARFRAC(start_date, end_date, [basis])', description: 'Fracción de año entre fechas.' },
  { name: 'DATEDIF', alias: 'SIFECHA', syntax: 'DATEDIF(start_date, end_date, unit)', description: 'Diferencia entre fechas en días, meses o años.' },
  { name: 'IVA', alias: 'IVA', syntax: 'IVA(base, [rate])', description: 'Calcula impuesto IVA sobre una base.' },
  { name: 'PRECIOCONIVA', alias: 'CONIVA', syntax: 'PRECIOCONIVA(base, [rate])', description: 'Precio total con IVA.' },
  { name: 'SINIVA', alias: 'SUBTOTALIVA', syntax: 'SINIVA(total, [rate])', description: 'Obtiene subtotal antes de IVA.' },
  { name: 'IMPUESTO', alias: 'TAX', syntax: 'IMPUESTO(base, rate)', description: 'Calcula cualquier impuesto por porcentaje.' },
  { name: 'DESCUENTO', alias: 'DISCOUNT', syntax: 'DESCUENTO(amount, rate)', description: 'Monto final después de descuento.' },
  { name: 'MONTO_DESCUENTO', alias: 'DISCOUNTAMOUNT', syntax: 'MONTO_DESCUENTO(amount, rate)', description: 'Cantidad descontada.' },
  { name: 'MARGEN', alias: 'MARGIN', syntax: 'MARGEN(price, cost)', description: 'Margen de utilidad sobre precio de venta.' },
  { name: 'MARKUP', alias: 'RECARGO', syntax: 'MARKUP(price, cost)', description: 'Markup sobre costo.' },
  { name: 'UTILIDAD', alias: 'UTILIDAD', syntax: 'UTILIDAD(price, cost, [quantity])', description: 'Ganancia monetaria.' },
  { name: 'UTILIDADPORC', alias: 'UTILIDAD_PORC', syntax: 'UTILIDADPORC(price, cost)', description: 'Porcentaje de utilidad sobre venta.' },
  { name: 'COSTO_TOTAL', alias: 'COSTOTOTAL', syntax: 'COSTO_TOTAL(cost, quantity)', description: 'Costo total por cantidad.' },
  { name: 'VENTA_TOTAL', alias: 'VENTATOTAL', syntax: 'VENTA_TOTAL(price, quantity, [discount], [tax])', description: 'Total de venta con descuento e impuesto opcional.' },
  { name: 'PUNTOEQUILIBRIO', alias: 'BREAK_EVEN', syntax: 'PUNTOEQUILIBRIO(fixed_costs, price, variable_cost)', description: 'Unidades necesarias para cubrir costos.' },
  { name: 'ROTACION', alias: 'ROTACION_INVENTARIO', syntax: 'ROTACION(cost_of_goods_sold, average_inventory)', description: 'Rotación de inventario.' },
  { name: 'DIASCARTERA', alias: 'DSO', syntax: 'DIASCARTERA(accounts_receivable, sales, days)', description: 'Días promedio de cartera.' },
  { name: 'RAZONCORRIENTE', alias: 'CURRENT_RATIO', syntax: 'RAZONCORRIENTE(current_assets, current_liabilities)', description: 'Razón corriente de liquidez.' },
  { name: 'PRUEBAACIDA', alias: 'QUICK_RATIO', syntax: 'PRUEBAACIDA(current_assets, inventory, current_liabilities)', description: 'Prueba ácida de liquidez.' },
  { name: 'ENDEUDAMIENTO', alias: 'DEBT_RATIO', syntax: 'ENDEUDAMIENTO(total_liabilities, total_assets)', description: 'Porcentaje de endeudamiento.' },
  { name: 'ROI', alias: 'ROI', syntax: 'ROI(gain, investment)', description: 'Retorno sobre inversión.' },
  { name: 'ROA', alias: 'ROA', syntax: 'ROA(net_income, total_assets)', description: 'Retorno sobre activos.' },
  { name: 'ROE', alias: 'ROE', syntax: 'ROE(net_income, equity)', description: 'Retorno sobre capital.' },
  { name: 'STDEV', alias: 'DESVEST', syntax: 'STDEV(number1, [number2], ...)', description: 'Desviación estándar muestral.' },
  { name: 'VAR', alias: 'VAR', syntax: 'VAR(number1, [number2], ...)', description: 'Varianza muestral.' },
  { name: 'LARGE', alias: 'K.ESIMO.MAYOR', syntax: 'LARGE(array, k)', description: 'K-ésimo valor más grande.' },
  { name: 'SMALL', alias: 'K.ESIMO.MENOR', syntax: 'SMALL(array, k)', description: 'K-ésimo valor más pequeño.' },
  { name: 'RAND', alias: 'ALEATORIO', syntax: 'RAND()', description: 'Número aleatorio entre 0 y 1.' },
  { name: 'RANDBETWEEN', alias: 'ALEATORIO.ENTRE', syntax: 'RANDBETWEEN(min, max)', description: 'Número aleatorio entero entre mínimo y máximo.' },
  { name: 'PI', alias: 'PI', syntax: 'PI()', description: 'Valor de pi.' },
  { name: 'SIN', alias: 'SENO', syntax: 'SIN(number)', description: 'Seno de un ángulo en radianes.' },
  { name: 'COS', alias: 'COS', syntax: 'COS(number)', description: 'Coseno de un ángulo en radianes.' },
  { name: 'TAN', alias: 'TAN', syntax: 'TAN(number)', description: 'Tangente de un ángulo en radianes.' },
  { name: 'LOG', alias: 'LOG', syntax: 'LOG(number, [base])', description: 'Logaritmo con base opcional.' },
  { name: 'LN', alias: 'LN', syntax: 'LN(number)', description: 'Logaritmo natural.' },
  { name: 'EXP', alias: 'EXP', syntax: 'EXP(number)', description: 'Eleva e al número indicado.' },
  { name: 'DAY', alias: 'DIA', syntax: 'DAY(date)', description: 'Día del mes.' },
  { name: 'MONTH', alias: 'MES', syntax: 'MONTH(date)', description: 'Mes de una fecha.' },
  { name: 'YEAR', alias: 'AÑO', syntax: 'YEAR(date)', description: 'Año de una fecha.' },
  { name: 'DAYS', alias: 'DIAS', syntax: 'DAYS(end_date, start_date)', description: 'Días reales entre dos fechas.' },
  { name: 'CLEAN', alias: 'LIMPIAR', syntax: 'CLEAN(text)', description: 'Elimina caracteres no imprimibles.' },
  { name: 'REPT', alias: 'REPETIR', syntax: 'REPT(text, count)', description: 'Repite un texto varias veces.' },
  { name: 'VALUE', alias: 'VALOR', syntax: 'VALUE(text)', description: 'Convierte texto numérico en número.' },
  { name: 'EXACT', alias: 'IGUAL', syntax: 'EXACT(text1, text2)', description: 'Compara dos textos exactamente.' },
  { name: 'XOR', alias: 'XO', syntax: 'XOR(condition1, condition2, ...)', description: 'Verdadero si hay número impar de condiciones verdaderas.' },
  { name: 'ISNA', alias: 'ESNOD', syntax: 'ISNA(value)', description: 'Comprueba si el valor es #N/A.' },

  { name: 'SUBTOTAL', alias: 'SUBTOTALES', syntax: 'SUBTOTAL(function_num, range1, [range2], ...)', description: 'Calcula subtotal usando códigos tipo Excel: 1 promedio, 2 contar, 3 contara, 9 suma, 101/109 ignoran filas ocultas en Excel.' },
  { name: 'SUMPRODUCT', alias: 'SUMAPRODUCTO', syntax: 'SUMPRODUCT(array1, [array2], ...)', description: 'Multiplica rangos posición por posición y suma el resultado.' },
  { name: 'COUNTBLANK', alias: 'CONTAR.BLANCO', syntax: 'COUNTBLANK(range)', description: 'Cuenta celdas vacías en un rango.' },
  { name: 'FREQUENCY', alias: 'FRECUENCIA', syntax: 'FREQUENCY(data_array, bins_array)', description: 'Cuenta datos por rangos o bins. Devuelve una lista separada por comas.' },
  { name: 'PERCENTRANK', alias: 'RANGO.PERCENTIL', syntax: 'PERCENTRANK(array, x)', description: 'Devuelve la posición porcentual de un valor dentro de una lista.' },
  { name: 'COVARIANCE', alias: 'COVARIANZA', syntax: 'COVARIANCE(array1, array2)', description: 'Covarianza poblacional entre dos conjuntos.' },
  { name: 'CORREL', alias: 'COEF.DE.CORREL', syntax: 'CORREL(array1, array2)', description: 'Coeficiente de correlación entre dos conjuntos.' },
  { name: 'GEOMEAN', alias: 'MEDIA.GEOM', syntax: 'GEOMEAN(number1, [number2], ...)', description: 'Media geométrica, útil para crecimiento compuesto.' },
  { name: 'HARMEAN', alias: 'MEDIA.ARMO', syntax: 'HARMEAN(number1, [number2], ...)', description: 'Media armónica.' },
  { name: 'XNPV', alias: 'VNA.NO.PER', syntax: 'XNPV(rate, values, dates)', description: 'Valor presente neto con fechas reales no periódicas.' },
  { name: 'XIRR', alias: 'TIR.NO.PER', syntax: 'XIRR(values, dates, [guess])', description: 'Tasa interna de retorno con fechas reales no periódicas.' },
  { name: 'DISC', alias: 'TASA.DESC', syntax: 'DISC(settlement, maturity, pr, redemption, [basis])', description: 'Tasa de descuento de un valor financiero.' },
  { name: 'INTRATE', alias: 'TASA.INT', syntax: 'INTRATE(settlement, maturity, investment, redemption, [basis])', description: 'Tasa de interés de una inversión entre dos fechas.' },
  { name: 'RECEIVED', alias: 'CANTIDAD.RECIBIDA', syntax: 'RECEIVED(settlement, maturity, investment, discount, [basis])', description: 'Cantidad recibida al vencimiento de una inversión descontada.' },
  { name: 'DURATION', alias: 'DURACION', syntax: 'DURATION(settlement, maturity, coupon, yld, frequency, [basis])', description: 'Duración Macaulay aproximada de un bono.' },
  { name: 'MDURATION', alias: 'DURACION.MODIF', syntax: 'MDURATION(settlement, maturity, coupon, yld, frequency, [basis])', description: 'Duración modificada aproximada de un bono.' },
  { name: 'PRICEDISC', alias: 'PRECIO.DESCUENTO', syntax: 'PRICEDISC(settlement, maturity, discount, redemption, [basis])', description: 'Precio de un valor vendido con descuento.' },
  { name: 'YIELDDISC', alias: 'RENDTO.DESCUENTO', syntax: 'YIELDDISC(settlement, maturity, pr, redemption, [basis])', description: 'Rendimiento anual de un valor descontado.' },
  { name: 'TBILLEQ', alias: 'LETRA.DE.TES.EQV.A.BONO', syntax: 'TBILLEQ(settlement, maturity, discount)', description: 'Rendimiento equivalente a bono para CETES/T-Bill aproximado.' },
  { name: 'TBILLPRICE', alias: 'LETRA.DE.TES.PRECIO', syntax: 'TBILLPRICE(settlement, maturity, discount)', description: 'Precio por 100 de una letra con descuento.' },
  { name: 'TBILLYIELD', alias: 'LETRA.DE.TES.RENDTO', syntax: 'TBILLYIELD(settlement, maturity, price)', description: 'Rendimiento de una letra con precio dado.' },
  { name: 'SUBTOTAL_FACTURA', alias: 'BASE_FACTURA', syntax: 'SUBTOTAL_FACTURA(total, iva_rate, [ret_iva_rate], [ret_isr_rate])', description: 'Obtiene la base antes de IVA y retenciones partiendo del total.' },
  { name: 'TOTAL_FACTURA', alias: 'TOTALCFDI', syntax: 'TOTAL_FACTURA(subtotal, [iva_rate], [ret_iva_rate], [ret_isr_rate])', description: 'Total de factura con IVA y retenciones.' },
  { name: 'RETENCION_IVA', alias: 'RETIVA', syntax: 'RETENCION_IVA(base, [rate])', description: 'Calcula retención de IVA. Por defecto 10.6667%.' },
  { name: 'RETENCION_ISR', alias: 'RETISR', syntax: 'RETENCION_ISR(base, [rate])', description: 'Calcula retención de ISR con tasa configurable.' },
  { name: 'IVA16', alias: 'IVA_16', syntax: 'IVA16(base)', description: 'IVA del 16%.' },
  { name: 'IVA8', alias: 'IVA_8', syntax: 'IVA8(base)', description: 'IVA del 8%, útil en frontera cuando aplica.' },
  { name: 'BASE_DESDE_TOTAL', alias: 'BASE_TOTAL', syntax: 'BASE_DESDE_TOTAL(total, [tax_rate])', description: 'Obtiene la base antes de impuesto desde un total con impuesto incluido.' },
  { name: 'REDONDEO_FISCAL', alias: 'REDONDEO', syntax: 'REDONDEO_FISCAL(amount, [digits])', description: 'Redondeo fiscal estándar a 2 decimales por defecto.' },
  { name: 'DIFERENCIA', alias: 'DIF', syntax: 'DIFERENCIA(value1, value2)', description: 'Diferencia absoluta entre dos importes.' },
  { name: 'CONCILIADO', alias: 'MATCH_CONTABLE', syntax: 'CONCILIADO(value1, value2, [tolerance])', description: 'Devuelve TRUE si dos importes cuadran dentro de una tolerancia.' },
  { name: 'SALDO', alias: 'BALANCE_CONTABLE', syntax: 'SALDO(debe, haber, [saldo_inicial])', description: 'Calcula saldo contable: saldo inicial + debe - haber.' },
  { name: 'DEUDOR_ACREEDOR', alias: 'NATURALEZA_SALDO', syntax: 'DEUDOR_ACREEDOR(debe, haber, [saldo_inicial])', description: 'Indica si el saldo es Deudor, Acreedor o Saldado.' },
  { name: 'VARIACION', alias: 'CAMBIO', syntax: 'VARIACION(actual, anterior)', description: 'Cambio absoluto entre dos importes.' },
  { name: 'VARIACIONPORC', alias: 'CAMBIO_PORC', syntax: 'VARIACIONPORC(actual, anterior)', description: 'Cambio porcentual respecto al valor anterior.' },
  { name: 'PORCENTAJE', alias: 'PORC', syntax: 'PORCENTAJE(part, total)', description: 'Porcentaje que representa una parte sobre un total.' },
  { name: 'PROMEDIO_PONDERADO', alias: 'MEDIA.PONDERADA', syntax: 'PROMEDIO_PONDERADO(values, weights)', description: 'Promedio ponderado, útil para costos promedio.' },
  { name: 'COSTO_PROMEDIO', alias: 'CPP', syntax: 'COSTO_PROMEDIO(costs, quantities)', description: 'Costo promedio ponderado por cantidades.' },
  { name: 'MARGEN_BRUTO', alias: 'GROSS_MARGIN', syntax: 'MARGEN_BRUTO(sales, cost)', description: 'Margen bruto sobre ventas.' },
  { name: 'MARGEN_OPERATIVO', alias: 'OPERATING_MARGIN', syntax: 'MARGEN_OPERATIVO(operating_income, sales)', description: 'Margen operativo.' },
  { name: 'MARGEN_NETO', alias: 'NET_MARGIN', syntax: 'MARGEN_NETO(net_income, sales)', description: 'Margen neto.' },
  { name: 'EBITDA', alias: 'EBITDA', syntax: 'EBITDA(operating_income, depreciation, amortization)', description: 'Calcula EBITDA simple.' },
  { name: 'EBITDA_MARGEN', alias: 'EBITDA_MARGIN', syntax: 'EBITDA_MARGEN(ebitda, sales)', description: 'Margen EBITDA.' },
  { name: 'CAPITAL_TRABAJO', alias: 'WORKING_CAPITAL', syntax: 'CAPITAL_TRABAJO(current_assets, current_liabilities)', description: 'Capital de trabajo.' },
  { name: 'APALANCAMIENTO', alias: 'LEVERAGE', syntax: 'APALANCAMIENTO(total_assets, equity)', description: 'Razón de apalancamiento activos/capital.' },
  { name: 'COBERTURA_INTERESES', alias: 'INTEREST_COVERAGE', syntax: 'COBERTURA_INTERESES(ebit, interest_expense)', description: 'Veces que la utilidad cubre intereses.' },
  { name: 'CICLO_CONVERSION_EFECTIVO', alias: 'CCE', syntax: 'CICLO_CONVERSION_EFECTIVO(dio, dso, dpo)', description: 'Ciclo de conversión de efectivo.' },
  { name: 'DIO', alias: 'DIAS_INVENTARIO', syntax: 'DIO(avg_inventory, cogs, [days])', description: 'Días de inventario.' },
  { name: 'DPO', alias: 'DIAS_PROVEEDORES', syntax: 'DPO(accounts_payable, cogs, [days])', description: 'Días promedio de pago a proveedores.' },
  { name: 'VENCIDO', alias: 'ESTA_VENCIDO', syntax: 'VENCIDO(due_date, [as_of])', description: 'TRUE si una fecha de vencimiento ya pasó.' },
  { name: 'DIAS_VENCIDO', alias: 'DIAS_MORA', syntax: 'DIAS_VENCIDO(due_date, [as_of])', description: 'Días transcurridos desde vencimiento. Nunca baja de 0.' },
  { name: 'ANTIGUEDAD_CARTERA', alias: 'AGING', syntax: 'ANTIGUEDAD_CARTERA(due_date, [as_of])', description: 'Clasifica cartera: Vigente, 1-30, 31-60, 61-90 o 90+.' },
  { name: 'PROVISION_CARTERA', alias: 'PROVISION_CXC', syntax: 'PROVISION_CARTERA(amount, days_overdue)', description: 'Estimación simple de provisión según días vencidos.' },
  { name: 'INTERES_MORATORIO', alias: 'MORA', syntax: 'INTERES_MORATORIO(amount, annual_rate, days)', description: 'Interés moratorio proporcional por días.' },
  { name: 'DESCUENTO_PRONTO_PAGO', alias: 'PRONTO_PAGO', syntax: 'DESCUENTO_PRONTO_PAGO(amount, discount_rate, pay_date, due_date)', description: 'Aplica descuento si se paga a tiempo.' },
  { name: 'NOMINA_NETA', alias: 'SUELDO_NETO', syntax: 'NOMINA_NETA(gross, isr, imss, [other])', description: 'Sueldo neto simple después de deducciones.' },
  { name: 'COMISION', alias: 'COMISION_VENTA', syntax: 'COMISION(sales, rate, [base])', description: 'Comisión sobre ventas o excedente de una base.' },
  { name: 'PRESUPUESTO_VARIACION', alias: 'VAR_PRESUPUESTO', syntax: 'PRESUPUESTO_VARIACION(real, budget)', description: 'Diferencia entre real y presupuesto.' },
  { name: 'PRESUPUESTO_VARIACION_PORC', alias: 'VAR_PRESUPUESTO_PORC', syntax: 'PRESUPUESTO_VARIACION_PORC(real, budget)', description: 'Variación porcentual contra presupuesto.' },
];

EXCEL_FORMULA_CATALOG.push(
  { name: 'AVERAGEA', alias: 'PROMEDIOA', syntax: 'AVERAGEA(value1, [value2], ...)', description: 'Promedia números y cuenta TRUE como 1, FALSE/texto como 0.' },
  { name: 'MAXA', syntax: 'MAXA(value1, [value2], ...)', description: 'Máximo considerando valores lógicos/texto como Excel.' },
  { name: 'MINA', syntax: 'MINA(value1, [value2], ...)', description: 'Mínimo considerando valores lógicos/texto como Excel.' },
  { name: 'SUMSQ', alias: 'SUMA.CUADRADOS', syntax: 'SUMSQ(number1, [number2], ...)', description: 'Suma los cuadrados de los valores.' },
  { name: 'DEVSQ', alias: 'DESVIA2', syntax: 'DEVSQ(number1, [number2], ...)', description: 'Suma de desviaciones cuadradas respecto al promedio.' },
  { name: 'AVEDEV', alias: 'DESVPROM', syntax: 'AVEDEV(number1, [number2], ...)', description: 'Promedio de desviaciones absolutas.' },
  { name: 'AGGREGATE', alias: 'AGREGAR', syntax: 'AGGREGATE(function_num, options, ref1, [ref2], ...)', description: 'Ejecuta agregados tipo SUM, COUNT, AVERAGE, MAX, MIN, etc.' },
  { name: 'TEXT', alias: 'TEXTO', syntax: 'TEXT(value, format)', description: 'Da formato simple a números o fechas.' },
  { name: 'FIXED', alias: 'DECIMAL', syntax: 'FIXED(number, [decimals], [no_commas])', description: 'Formatea número con decimales fijos.' },
  { name: 'DOLLAR', alias: 'MONEDA', syntax: 'DOLLAR(number, [decimals])', description: 'Formatea un importe como moneda.' },
  { name: 'NUMBERVALUE', alias: 'VALOR.NUMERO', syntax: 'NUMBERVALUE(text, [decimal_separator], [group_separator])', description: 'Convierte texto con separadores a número.' },
  { name: 'DATEVALUE', alias: 'FECHANUMERO', syntax: 'DATEVALUE(date_text)', description: 'Convierte texto de fecha a número serial aproximado de Excel.' },
  { name: 'TIMEVALUE', alias: 'HORANUMERO', syntax: 'TIMEVALUE(time_text)', description: 'Convierte hora en fracción del día.' },
  { name: 'WORKDAY.INTL', alias: 'DIA.LAB.INTL', syntax: 'WORKDAY.INTL(start_date, days, [weekend], [holidays])', description: 'Suma días laborales con fin de semana configurable.' },
  { name: 'NETWORKDAYS.INTL', alias: 'DIAS.LAB.INTL', syntax: 'NETWORKDAYS.INTL(start_date, end_date, [weekend], [holidays])', description: 'Cuenta días laborales con fin de semana configurable.' },
  { name: 'EFFECTIVE_MONTHLY_RATE', alias: 'TASA_EFECTIVA_MENSUAL', syntax: 'TASA_EFECTIVA_MENSUAL(annual_rate)', description: 'Convierte tasa anual efectiva a tasa mensual.' },
  { name: 'EFFECTIVE_ANNUAL_RATE', alias: 'TASA_EFECTIVA_ANUAL', syntax: 'TASA_EFECTIVA_ANUAL(monthly_rate)', description: 'Convierte tasa mensual a tasa anual efectiva.' },
  { name: 'SIMPLE_INTEREST', alias: 'INTERES_SIMPLE', syntax: 'INTERES_SIMPLE(principal, annual_rate, days)', description: 'Interés simple proporcional por días.' },
  { name: 'COMPOUND_INTEREST', alias: 'INTERES_COMPUESTO', syntax: 'INTERES_COMPUESTO(principal, rate, periods)', description: 'Interés compuesto generado.' },
  { name: 'FINAL_CAPITAL', alias: 'CAPITAL_FINAL', syntax: 'CAPITAL_FINAL(principal, rate, periods)', description: 'Capital final con interés compuesto.' },
  { name: 'INITIAL_CAPITAL', alias: 'CAPITAL_INICIAL', syntax: 'CAPITAL_INICIAL(final_amount, rate, periods)', description: 'Capital inicial necesario para llegar a un monto futuro.' },
  { name: 'IVA_POR_PAGAR', syntax: 'IVA_POR_PAGAR(iva_trasladado, iva_acreditable)', description: 'IVA a pagar o a favor.' },
  { name: 'IVA_TRASLADADO', syntax: 'IVA_TRASLADADO(base, [rate])', description: 'IVA cobrado en ventas.' },
  { name: 'IVA_ACREDITABLE', syntax: 'IVA_ACREDITABLE(base, [rate])', description: 'IVA acreditable de compras/gastos.' },
  { name: 'HONORARIOS_NETO', syntax: 'HONORARIOS_NETO(base, [iva], [ret_iva], [ret_isr])', description: 'Total neto de recibo de honorarios con IVA y retenciones.' },
  { name: 'ISR_PROVISIONAL', syntax: 'ISR_PROVISIONAL(income, deductions, rate)', description: 'Estimación simple de ISR provisional sobre utilidad.' },
  { name: 'CONTRIBUCION_UNITARIA', syntax: 'CONTRIBUCION_UNITARIA(price, variable_cost)', description: 'Precio menos costo variable unitario.' },
  { name: 'MARGEN_CONTRIBUCION', syntax: 'MARGEN_CONTRIBUCION(price, variable_cost)', description: 'Margen de contribución sobre precio.' },
  { name: 'PUNTO_EQUILIBRIO_VENTAS', syntax: 'PUNTO_EQUILIBRIO_VENTAS(fixed_costs, contribution_margin)', description: 'Ventas necesarias para punto de equilibrio.' },
  { name: 'DEPRECIACION_MENSUAL', syntax: 'DEPRECIACION_MENSUAL(cost, salvage, months)', description: 'Depreciación lineal mensual.' },
  { name: 'DEPRECIACION_ACUMULADA', syntax: 'DEPRECIACION_ACUMULADA(cost, salvage, months_total, months_elapsed)', description: 'Depreciación acumulada lineal.' },
  { name: 'VALOR_LIBROS', syntax: 'VALOR_LIBROS(cost, accumulated_depreciation)', description: 'Valor en libros de un activo.' },
  { name: 'SALDO_FINAL', syntax: 'SALDO_FINAL(initial_balance, charges, credits)', description: 'Saldo final simple.' },
  { name: 'CUADRA_DEBE_HABER', syntax: 'CUADRA_DEBE_HABER(debe, haber, [tolerance])', description: 'Valida si debe y haber cuadran.' },
  { name: 'CONCILIACION_BANCARIA', syntax: 'CONCILIACION_BANCARIA(book_balance, deposits_in_transit, outstanding_checks, bank_fees, interest)', description: 'Conciliación bancaria aproximada.' },
  { name: 'SALDO_INSOLUTO', syntax: 'SALDO_INSOLUTO(principal, rate, nper, payments_made)', description: 'Saldo pendiente de un préstamo después de pagos.' },
  { name: 'PAYBACK', alias: 'RECUPERACION', syntax: 'PAYBACK(initial_investment, cashflows)', description: 'Periodo aproximado de recuperación de inversión.' },
  { name: 'PROFIT_FACTOR', alias: 'FACTOR_GANANCIA', syntax: 'PROFIT_FACTOR(cashflows)', description: 'Ganancias positivas divididas entre pérdidas absolutas.' },
  { name: 'COUPDAYS', alias: 'CUPON.DIAS', syntax: 'COUPDAYS(settlement, maturity, frequency, [basis])', description: 'Días del periodo de cupón aproximado.' },
  { name: 'COUPDAYBS', alias: 'CUPON.DIAS.L1', syntax: 'COUPDAYBS(settlement, maturity, frequency, [basis])', description: 'Días desde el inicio del cupón hasta liquidación.' },
  { name: 'COUPDAYSNC', alias: 'CUPON.DIAS.L2', syntax: 'COUPDAYSNC(settlement, maturity, frequency, [basis])', description: 'Días desde liquidación hasta siguiente cupón.' },
  { name: 'COUPNUM', alias: 'CUPON.NUM', syntax: 'COUPNUM(settlement, maturity, frequency, [basis])', description: 'Número de cupones restantes aproximado.' },
  { name: 'ACCRINTM', alias: 'INT.ACUM.V', syntax: 'ACCRINTM(issue, maturity, rate, par, [basis])', description: 'Interés acumulado al vencimiento.' },
  { name: 'ACCRINT', alias: 'INT.ACUM', syntax: 'ACCRINT(issue, first_interest, settlement, rate, par, frequency, [basis])', description: 'Interés acumulado periódico aproximado.' },
  { name: 'FILTER', alias: 'FILTRAR', syntax: 'FILTER(array, include, [if_empty])', description: 'Filtra una matriz usando TRUE/FALSE o criterios.' },
  { name: 'UNIQUE', alias: 'UNICOS', syntax: 'UNIQUE(array)', description: 'Devuelve valores únicos.' },
  { name: 'SORT', alias: 'ORDENAR', syntax: 'SORT(array, [sort_index], [sort_order])', description: 'Ordena una matriz por columna.' },
  { name: 'TAKE', alias: 'TOMAR', syntax: 'TAKE(array, rows, [columns])', description: 'Toma primeras/últimas filas y columnas.' },
  { name: 'DROP', alias: 'SOLTAR', syntax: 'DROP(array, rows, [columns])', description: 'Quita primeras/últimas filas y columnas.' }
);


EXCEL_FORMULA_CATALOG.push(
  { name: 'STDEV.S', alias: 'DESVEST.M', syntax: 'STDEV.S(number1, [number2], ...)', description: 'Desviación estándar muestral, como Excel.' },
  { name: 'STDEV.P', alias: 'DESVEST.P', syntax: 'STDEV.P(number1, [number2], ...)', description: 'Desviación estándar poblacional.' },
  { name: 'VAR.S', alias: 'VAR.S', syntax: 'VAR.S(number1, [number2], ...)', description: 'Varianza muestral.' },
  { name: 'VAR.P', alias: 'VAR.P', syntax: 'VAR.P(number1, [number2], ...)', description: 'Varianza poblacional.' },
  { name: 'PERCENTILE.INC', alias: 'PERCENTIL.INC', syntax: 'PERCENTILE.INC(array, k)', description: 'Percentil inclusivo de un rango.' },
  { name: 'PERCENTILE.EXC', alias: 'PERCENTIL.EXC', syntax: 'PERCENTILE.EXC(array, k)', description: 'Percentil exclusivo de un rango.' },
  { name: 'QUARTILE.INC', alias: 'CUARTIL.INC', syntax: 'QUARTILE.INC(array, quart)', description: 'Cuartil inclusivo.' },
  { name: 'QUARTILE.EXC', alias: 'CUARTIL.EXC', syntax: 'QUARTILE.EXC(array, quart)', description: 'Cuartil exclusivo.' },
  { name: 'PERCENTRANK.INC', alias: 'RANGO.PERCENTIL.INC', syntax: 'PERCENTRANK.INC(array, x, [significance])', description: 'Rango porcentual inclusivo de un valor dentro de una lista.' },
  { name: 'PERCENTRANK.EXC', alias: 'RANGO.PERCENTIL.EXC', syntax: 'PERCENTRANK.EXC(array, x, [significance])', description: 'Rango porcentual exclusivo de un valor dentro de una lista.' },
  { name: 'STANDARDIZE', alias: 'NORMALIZACION', syntax: 'STANDARDIZE(x, mean, standard_dev)', description: 'Convierte un valor a puntaje Z.' },
  { name: 'NORM.DIST', alias: 'DISTR.NORM.N', syntax: 'NORM.DIST(x, mean, standard_dev, cumulative)', description: 'Distribución normal con media y desviación estándar.' },
  { name: 'NORM.S.DIST', alias: 'DISTR.NORM.ESTAND.N', syntax: 'NORM.S.DIST(z, cumulative)', description: 'Distribución normal estándar.' },
  { name: 'NORM.INV', alias: 'INV.NORM', syntax: 'NORM.INV(probability, mean, standard_dev)', description: 'Inversa de distribución normal.' },
  { name: 'NORM.S.INV', alias: 'INV.NORM.ESTAND', syntax: 'NORM.S.INV(probability)', description: 'Inversa de la normal estándar.' },
  { name: 'FORECAST.LINEAR', alias: 'PRONOSTICO.LINEAL', syntax: 'FORECAST.LINEAR(x, known_y, known_x)', description: 'Pronóstico lineal para un valor x.' },
  { name: 'SLOPE', alias: 'PENDIENTE', syntax: 'SLOPE(known_y, known_x)', description: 'Pendiente de una regresión lineal.' },
  { name: 'INTERCEPT', alias: 'INTERSECCION.EJE', syntax: 'INTERCEPT(known_y, known_x)', description: 'Intersección con el eje Y.' },
  { name: 'RSQ', alias: 'COEFICIENTE.R2', syntax: 'RSQ(known_y, known_x)', description: 'Coeficiente R² de una regresión.' },
  { name: 'FORECAST.ETS', alias: 'PRONOSTICO.ETS', syntax: 'FORECAST.ETS(target_date, values, timeline)', description: 'Pronóstico simple basado en tendencia temporal.' },
  { name: 'ISPMT', alias: 'PAGO.INT', syntax: 'ISPMT(rate, per, nper, pv)', description: 'Interés pagado en un periodo usando amortización lineal.' },
  { name: 'CAGR', alias: 'TCAC', syntax: 'CAGR(begin_value, end_value, periods)', description: 'Tasa de crecimiento anual compuesto.' },
  { name: 'GROWTH_RATE', alias: 'TASA_CRECIMIENTO', syntax: 'GROWTH_RATE(new_value, old_value)', description: 'Crecimiento porcentual entre dos valores.' },
  { name: 'DSO', alias: 'DIAS_COBRANZA', syntax: 'DSO(accounts_receivable, credit_sales, [days])', description: 'Días de ventas pendientes de cobro.' },
  { name: 'INVENTORY_TURNOVER', alias: 'ROTACION_INVENTARIO', syntax: 'INVENTORY_TURNOVER(cogs, average_inventory)', description: 'Rotación de inventario.' },
  { name: 'ASSET_TURNOVER', alias: 'ROTACION_ACTIVOS', syntax: 'ASSET_TURNOVER(sales, average_assets)', description: 'Rotación de activos.' },
  { name: 'DEBT_TO_EQUITY', alias: 'DEUDA_CAPITAL', syntax: 'DEBT_TO_EQUITY(total_debt, equity)', description: 'Razón deuda/capital.' },
  { name: 'GROSS_PROFIT', alias: 'UTILIDAD_BRUTA', syntax: 'GROSS_PROFIT(sales, cost)', description: 'Utilidad bruta en dinero.' },
  { name: 'OPERATING_PROFIT', alias: 'UTILIDAD_OPERATIVA', syntax: 'OPERATING_PROFIT(gross_profit, operating_expenses)', description: 'Utilidad operativa.' },
  { name: 'NET_PROFIT', alias: 'UTILIDAD_NETA', syntax: 'NET_PROFIT(income, expenses, taxes)', description: 'Utilidad neta simple.' },
  { name: 'BREAK_EVEN_UNITS', alias: 'PUNTO_EQUILIBRIO_UNIDADES', syntax: 'BREAK_EVEN_UNITS(fixed_costs, price, variable_cost)', description: 'Unidades necesarias para punto de equilibrio.' },
  { name: 'SAFETY_MARGIN', alias: 'MARGEN_SEGURIDAD', syntax: 'SAFETY_MARGIN(actual_sales, break_even_sales)', description: 'Margen de seguridad contra punto de equilibrio.' },
  { name: 'VAT_INCLUDED_RATE', alias: 'TASA_DESDE_TOTAL', syntax: 'VAT_INCLUDED_RATE(total, base)', description: 'Obtiene la tasa incluida comparando total contra base.' },
  { name: 'PRORATE', alias: 'PRORRATEAR', syntax: 'PRORATE(amount, weight, total_weight)', description: 'Prorratea un importe según una ponderación.' },
  { name: 'ALLOCATE_BY_WEIGHT', alias: 'ASIGNAR_POR_PESO', syntax: 'ALLOCATE_BY_WEIGHT(total_amount, weights)', description: 'Distribuye un total por pesos/porcentajes.' },
  { name: 'AGING_BUCKET', alias: 'RANGO_ANTIGUEDAD', syntax: 'AGING_BUCKET(days_overdue)', description: 'Clasifica días vencidos en Vigente, 1-30, 31-60, 61-90, 90+.' },
  { name: 'TEXTBEFORE', alias: 'TEXTOANTES', syntax: 'TEXTBEFORE(text, delimiter)', description: 'Texto antes de un separador.' },
  { name: 'TEXTAFTER', alias: 'TEXTODESPUES', syntax: 'TEXTAFTER(text, delimiter)', description: 'Texto después de un separador.' },
  { name: 'TEXTSPLIT', alias: 'DIVIDIRTEXTO', syntax: 'TEXTSPLIT(text, delimiter)', description: 'Divide texto por separador.' },
  { name: 'TRIMMEAN', alias: 'MEDIA.ACOTADA', syntax: 'TRIMMEAN(array, percent)', description: 'Promedio excluyendo extremos.' },
  { name: 'CHOOSECOLS', alias: 'ELEGIRCOLS', syntax: 'CHOOSECOLS(array, col_num1, [col_num2], ...)', description: 'Devuelve columnas específicas de una matriz.' },
  { name: 'CHOOSEROWS', alias: 'ELEGIRFILAS', syntax: 'CHOOSEROWS(array, row_num1, [row_num2], ...)', description: 'Devuelve filas específicas de una matriz.' },
  { name: 'TRANSPOSE', alias: 'TRANSPONER', syntax: 'TRANSPOSE(array)', description: 'Intercambia filas por columnas.' },
  { name: 'HSTACK', alias: 'APILARH', syntax: 'HSTACK(array1, [array2], ...)', description: 'Une matrices horizontalmente.' },
  { name: 'VSTACK', alias: 'APILARV', syntax: 'VSTACK(array1, [array2], ...)', description: 'Une matrices verticalmente.' },
  { name: 'XMATCH', alias: 'COINCIDIRX', syntax: 'XMATCH(lookup_value, lookup_array, [match_mode], [search_mode])', description: 'Busca posición con coincidencia exacta o aproximada.' },
  { name: 'ISLOGICAL', alias: 'ESLOGICO', syntax: 'ISLOGICAL(value)', description: 'Comprueba si un valor es TRUE/FALSE.' },
  { name: 'ISEVEN', alias: 'ESPAR', syntax: 'ISEVEN(number)', description: 'Comprueba si un número es par.' },
  { name: 'ISODD', alias: 'ESIMPAR', syntax: 'ISODD(number)', description: 'Comprueba si un número es impar.' },
  { name: 'ISNONTEXT', alias: 'ESNOTEXTO', syntax: 'ISNONTEXT(value)', description: 'Comprueba si un valor no es texto.' }
);


EXCEL_FORMULA_CATALOG.push(
  { name: 'FACT', alias: 'FACT', syntax: 'FACT(number)', description: 'Factorial de un número entero. Ejemplo: FACT(5) devuelve 120.' },
  { name: 'FACTDOUBLE', alias: 'FACT.DOBLE', syntax: 'FACTDOUBLE(number)', description: 'Doble factorial. Ejemplo: FACTDOUBLE(7) = 7*5*3*1.' },
  { name: 'COMBIN', alias: 'COMBINAT', syntax: 'COMBIN(number, number_chosen)', description: 'Combinaciones sin repetición. Útil para conteos estadísticos.' },
  { name: 'COMBINA', alias: 'COMBINA', syntax: 'COMBINA(number, number_chosen)', description: 'Combinaciones con repetición.' },
  { name: 'PERMUT', alias: 'PERMUTACIONES', syntax: 'PERMUT(number, number_chosen)', description: 'Permutaciones sin repetición.' },
  { name: 'PERMUTATIONA', alias: 'PERMUTACIONES.A', syntax: 'PERMUTATIONA(number, number_chosen)', description: 'Permutaciones con repetición.' },
  { name: 'MULTINOMIAL', alias: 'MULTINOMIAL', syntax: 'MULTINOMIAL(number1, [number2], ...)', description: 'Factorial de la suma dividido entre los factoriales de cada número.' },
  { name: 'QUOTIENT', alias: 'COCIENTE', syntax: 'QUOTIENT(numerator, denominator)', description: 'Parte entera de una división.' },
  { name: 'BASE', alias: 'BASE', syntax: 'BASE(number, radix, [min_length])', description: 'Convierte un número a otra base, por ejemplo hexadecimal.' },
  { name: 'DECIMAL', alias: 'DECIMAL', syntax: 'DECIMAL(text, radix)', description: 'Convierte texto en una base a decimal.' },
  { name: 'ROMAN', alias: 'ROMANO', syntax: 'ROMAN(number)', description: 'Convierte un número arábigo a romano.' },
  { name: 'ARABIC', alias: 'ARABIGO', syntax: 'ARABIC(text)', description: 'Convierte un número romano a arábigo.' },
  { name: 'CEILING.MATH', alias: 'MULTIPLO.SUPERIOR.MAT', syntax: 'CEILING.MATH(number, [significance])', description: 'Redondea hacia arriba al múltiplo indicado.' },
  { name: 'FLOOR.MATH', alias: 'MULTIPLO.INFERIOR.MAT', syntax: 'FLOOR.MATH(number, [significance])', description: 'Redondea hacia abajo al múltiplo indicado.' },
  { name: 'ISO.CEILING', alias: 'ISO.MULTIPLO.SUPERIOR', syntax: 'ISO.CEILING(number, [significance])', description: 'Redondeo superior estilo ISO.' },
  { name: 'TIME', alias: 'HORA', syntax: 'TIME(hour, minute, second)', description: 'Crea una hora como fracción de día. Ejemplo: TIME(12,0,0)=0.5.' },
  { name: 'ISDATE', alias: 'ESFECHA', syntax: 'ISDATE(value)', description: 'Comprueba si un valor puede leerse como fecha.' },
  { name: 'IFNA', alias: 'SI.ND', syntax: 'IFNA(value, value_if_na)', description: 'Devuelve respaldo solo cuando el valor es #N/A.' },
  { name: 'ISERR', alias: 'ESERR', syntax: 'ISERR(value)', description: 'Comprueba errores excepto #N/A.' },
  { name: 'ISFORMULA', alias: 'ESFORMULA', syntax: 'ISFORMULA(value)', description: 'Marcador de compatibilidad; devuelve FALSE en evaluación directa.' },
  { name: 'N', alias: 'N', syntax: 'N(value)', description: 'Convierte números, fechas y booleanos a número; texto devuelve 0.' },
  { name: 'T', alias: 'T', syntax: 'T(value)', description: 'Devuelve el texto si el valor es texto; si no, devuelve vacío.' },
  { name: 'CHAR', alias: 'CARACTER', syntax: 'CHAR(number)', description: 'Devuelve el carácter de un código ASCII/Unicode.' },
  { name: 'CODE', alias: 'CODIGO', syntax: 'CODE(text)', description: 'Devuelve el código del primer carácter.' },
  { name: 'UNICHAR', alias: 'UNICARACTER', syntax: 'UNICHAR(number)', description: 'Devuelve un carácter Unicode.' },
  { name: 'UNICODE', alias: 'UNICODE', syntax: 'UNICODE(text)', description: 'Devuelve el código Unicode del primer carácter.' },
  { name: 'RECEIVED_RATE', alias: 'TASA_RECIBIDA', syntax: 'RECEIVED_RATE(investment, received, days)', description: 'Tasa anual aproximada a partir de inversión, monto recibido y días.' },
  { name: 'EFFECTIVE_RATE_PERIOD', alias: 'TASA_EFECTIVA_PERIODO', syntax: 'EFFECTIVE_RATE_PERIOD(rate, periods_per_year)', description: 'Convierte tasa nominal anual a tasa efectiva por periodo.' },
  { name: 'AMORTIZATION_PAYMENT', alias: 'PAGO_AMORTIZACION', syntax: 'AMORTIZATION_PAYMENT(principal, annual_rate, periods)', description: 'Pago fijo aproximado de un préstamo con tasa anual.' },
  { name: 'RUNNING_TOTAL', alias: 'ACUMULADO', syntax: 'RUNNING_TOTAL(values)', description: 'Devuelve acumulados de una lista/rango.' },
  { name: 'PERCENT_OF_TOTAL', alias: 'PORC_DEL_TOTAL', syntax: 'PERCENT_OF_TOTAL(value, total)', description: 'Porcentaje que representa un valor sobre el total.' },
  { name: 'WEIGHTED_AVERAGE', alias: 'PROMEDIO_PONDERADO_EXCEL', syntax: 'WEIGHTED_AVERAGE(values, weights)', description: 'Promedio ponderado general.' },
  { name: 'SEQUENCE', alias: 'SECUENCIA', syntax: 'SEQUENCE(rows, [columns], [start], [step])', description: 'Genera una secuencia numérica tipo Excel 365.' },
  { name: 'TOCOL', alias: 'ACOLUMNA', syntax: 'TOCOL(array)', description: 'Convierte una matriz en una sola columna.' },
  { name: 'TOROW', alias: 'AFILA', syntax: 'TOROW(array)', description: 'Convierte una matriz en una sola fila.' },
  { name: 'WRAPROWS', alias: 'AJUSTARFILAS', syntax: 'WRAPROWS(vector, wrap_count)', description: 'Divide un vector en filas de cierto tamaño.' },
  { name: 'WRAPCOLS', alias: 'AJUSTARCOLS', syntax: 'WRAPCOLS(vector, wrap_count)', description: 'Divide un vector en columnas de cierto tamaño.' }
);

const EXCEL_FORMULA_SEARCH_INDEX = EXCEL_FORMULA_CATALOG.map((item) => ({
  ...item,
  _name: String(item.name || '').toUpperCase().replace(/\./g, '_'),
  _alias: String(item.alias || '').toUpperCase().replace(/\./g, '_'),
}));

export function getFormulaSuggestions(draft = '', limit = 10) {
  const text = String(draft || '');
  if (!text.trim().startsWith('=')) return [];
  const beforeCursor = text;
  const match = beforeCursor.match(/(?:^|[=+\-*/^&,(;])\s*([A-ZÁÉÍÓÚÑ._]*)$/i);
  if (!match) return [];
  const query = String(match[1] || '').toUpperCase().replace(/\./g, '_');
  if (!query && beforeCursor.trim() !== '=') return [];
  const source = EXCEL_FORMULA_SEARCH_INDEX || [];
  const starts = [];
  const contains = [];
  for (const item of source) {
    const hitStart = !query || item._name.startsWith(query) || item._alias.startsWith(query);
    const hitContains = query && !hitStart && (item._name.includes(query) || item._alias.includes(query));
    if (hitStart) starts.push(item);
    else if (hitContains) contains.push(item);
    if (starts.length >= limit) break;
  }
  return starts.concat(contains).slice(0, limit).map(({ _name, _alias, ...item }) => item);
}

export function columnIndexToLetter(index) {
  let value = Number(index) + 1;
  let letters = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }

  return letters || 'A';
}

export function makeCellId(rowIndex, colIndex) {
  return `${columnIndexToLetter(colIndex)}${Number(rowIndex) + 1}`;
}

export function parseCellId(cellId) {
  const match = String(cellId || '').toUpperCase().match(/^\$?([A-Z]+)\$?(\d+)$/);
  if (!match) return null;

  const letters = match[1];
  const row = Number(match[2]) - 1;
  let col = 0;

  for (let i = 0; i < letters.length; i += 1) {
    col = col * 26 + letters.charCodeAt(i) - 64;
  }

  return { row, col: col - 1 };
}

export function createEmptyGrid(rows = DEFAULT_ROWS, cols = DEFAULT_COLUMNS) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ value: '', formula: '', style: {} })),
  );
}


export function cellHasContent(cell) {
  if (!cell) return false;
  const hasValue = cell.value !== undefined && cell.value !== null && String(cell.value) !== '';
  const hasFormula = cell.formula !== undefined && cell.formula !== null && String(cell.formula) !== '';
  const hasStyle = cell.style && Object.keys(cell.style || {}).length > 0;
  return Boolean(hasValue || hasFormula || hasStyle);
}



export function rowHasContent(row = []) {
  return (row || []).some((cell) => cellHasContent(cell));
}

export function compactGridDataRows(grid = [], options = {}) {
  const {
    keepHeader = true,
    minRows = DEFAULT_ROWS,
    minCols = DEFAULT_COLUMNS,
  } = options;

  if (!Array.isArray(grid) || !grid.length) return createEmptyGrid(minRows, minCols);

  const headerRows = keepHeader ? [grid[0] || []] : [];
  const bodyRows = (keepHeader ? grid.slice(1) : grid).filter((row) => rowHasContent(row));
  const compactRows = [...headerRows, ...bodyRows];
  const maxCols = Math.max(
    minCols,
    ...compactRows.map((row) => row?.length || 0),
  );
  const totalRows = Math.max(minRows, compactRows.length);

  return Array.from({ length: totalRows }, (_, rowIndex) =>
    Array.from({ length: maxCols }, (_, colIndex) => ({
      value: compactRows[rowIndex]?.[colIndex]?.value ?? '',
      formula: compactRows[rowIndex]?.[colIndex]?.formula ?? '',
      style: compactRows[rowIndex]?.[colIndex]?.style || {},
    })),
  );
}

export function shouldCompactTableRows(grid = []) {
  if (!Array.isArray(grid) || grid.length < 4) return false;

  const headerContentCount = (grid[0] || []).filter((cell) => cellHasContent(cell)).length;
  if (headerContentCount < 2) return false;

  const contentRows = [];
  for (let rowIndex = 1; rowIndex < grid.length; rowIndex += 1) {
    if (rowHasContent(grid[rowIndex])) contentRows.push(rowIndex);
  }

  if (contentRows.length < 2) return false;

  for (let i = 1; i < contentRows.length; i += 1) {
    if (contentRows[i] - contentRows[i - 1] > 1) return true;
  }

  return false;
}

export function getGridDataBounds(grid = [], fallbackRows = DEFAULT_ROWS, fallbackCols = DEFAULT_COLUMNS) {
  let maxRow = -1;
  let maxCol = -1;

  (grid || []).forEach((row, rowIndex) => {
    (row || []).forEach((cell, colIndex) => {
      if (!cellHasContent(cell)) return;
      if (rowIndex > maxRow) maxRow = rowIndex;
      if (colIndex > maxCol) maxCol = colIndex;
    });
  });

  return {
    maxRow,
    maxCol,
    rows: Math.max(fallbackRows, maxRow + 1),
    cols: Math.max(fallbackCols, maxCol + 1),
    hasData: maxRow >= 0 || maxCol >= 0,
  };
}

export function normalizeLoadedCell(raw = {}) {
  const row = Number(raw.row_index ?? raw.rowIndex ?? raw.row ?? 0);
  const col = Number(raw.col_index ?? raw.colIndex ?? raw.col ?? 0);

  return {
    row,
    col,
    value: raw.value ?? '',
    formula: raw.formula ?? '',
    style: raw.style || {},
  };
}

export function getCellsDataBounds(cells = [], fallbackRows = DEFAULT_ROWS, fallbackCols = DEFAULT_COLUMNS) {
  let maxRow = -1;
  let maxCol = -1;

  (cells || []).forEach((rawCell) => {
    const cell = normalizeLoadedCell(rawCell);
    const hasValue = cell.value !== undefined && cell.value !== null && String(cell.value) !== '';
    const hasFormula = cell.formula !== undefined && cell.formula !== null && String(cell.formula) !== '';
    const hasStyle = cell.style && Object.keys(cell.style || {}).length > 0;
    if (!hasValue && !hasFormula && !hasStyle) return;

    if (Number.isFinite(cell.row) && cell.row >= 0 && cell.row > maxRow) maxRow = cell.row;
    if (Number.isFinite(cell.col) && cell.col >= 0 && cell.col > maxCol) maxCol = cell.col;
  });

  return {
    maxRow,
    maxCol,
    rows: Math.max(fallbackRows, maxRow + 1),
    cols: Math.max(fallbackCols, maxCol + 1),
    hasData: maxRow >= 0 || maxCol >= 0,
  };
}

export function gridToCells(sheetId, grid) {
  const cells = [];

  (grid || []).forEach((row, rowIndex) => {
    (row || []).forEach((cell, colIndex) => {
      if (!cellHasContent(cell)) return;

      cells.push({
        sheet_id: sheetId,
        row_index: rowIndex,
        col_index: colIndex,
        value: cell.value ?? '',
        formula: cell.formula ?? '',
        style: cell.style || {},
      });
    });
  });

  return cells;
}

export function cellsToGrid(cells = [], rows = DEFAULT_ROWS, cols = DEFAULT_COLUMNS, options = {}) {
  const cleanCells = (cells || [])
    .map(normalizeLoadedCell)
    .filter((cell) => Number.isFinite(cell.row) && Number.isFinite(cell.col) && cell.row >= 0 && cell.col >= 0)
    .sort((a, b) => (a.row - b.row) || (a.col - b.col));

  const bounds = getCellsDataBounds(cleanCells, rows, cols);
  const grid = createEmptyGrid(bounds.rows, bounds.cols);

  cleanCells.forEach((cell) => {
    if (!grid[cell.row] || !grid[cell.row][cell.col]) return;

    grid[cell.row][cell.col] = {
      value: cell.value ?? '',
      formula: cell.formula ?? '',
      style: cell.style || {},
    };
  });

  const shouldCompact = options.compactRows === true;
  if (shouldCompact) {
    return compactGridDataRows(grid, { keepHeader: true, minRows: rows, minCols: cols });
  }

  return grid;
}

export function ensureGridSize(grid = [], minRows = DEFAULT_ROWS, minCols = DEFAULT_COLUMNS) {
  const currentRows = grid.length;
  const currentCols = Math.max(grid[0]?.length || 0, minCols);
  const rows = Math.max(currentRows, minRows);
  const cols = Math.max(currentCols, minCols);

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => ({
      value: grid[rowIndex]?.[colIndex]?.value ?? '',
      formula: grid[rowIndex]?.[colIndex]?.formula ?? '',
      style: grid[rowIndex]?.[colIndex]?.style || {},
    })),
  );
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const clean = String(value).replace(/[$,]/g, '').trim();
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function normalizeSheetName(name = '') {
  return String(name)
    .trim()
    .replace(/^'/, '')
    .replace(/'$/, '')
    .toLowerCase();
}

function extractSheetName(sheetPrefix = '') {
  if (!sheetPrefix) return '';
  return sheetPrefix.replace(/!$/, '').replace(/^'/, '').replace(/'$/, '').trim();
}

function getContextGrid(context, sheetPrefix) {
  if (!context || !sheetPrefix) return context?.activeGrid || null;

  const sheetName = normalizeSheetName(extractSheetName(sheetPrefix));
  const foundSheet = (context.sheets || []).find(
    (sheet) => normalizeSheetName(sheet.name || sheet.nombre) === sheetName,
  );

  if (!foundSheet) return null;
  return context.gridsBySheet?.[foundSheet.id] || null;
}

function getCellRawValue(grid, cellId, context, sheetPrefix = '', visited = new Set()) {
  const sourceGrid = sheetPrefix ? getContextGrid(context, sheetPrefix) : grid;
  const parsed = parseCellId(cellId);
  if (!parsed || !sourceGrid) return 0;

  const key = `${sheetPrefix || context?.activeSheetId || 'active'}:${String(cellId).toUpperCase()}`;
  if (visited.has(key)) return '#CYCLE';

  const cell = sourceGrid[parsed.row]?.[parsed.col];
  if (!cell) return 0;

  if (cell.formula) {
    visited.add(key);
    return evaluateFormula(cell.formula, sourceGrid, context, visited);
  }

  return cell.value;
}

function getRangeValues(grid, startId, endId, context, sheetPrefix = '', visited = new Set()) {
  const sourceGrid = sheetPrefix ? getContextGrid(context, sheetPrefix) : grid;
  const start = parseCellId(startId);
  const end = parseCellId(endId);
  if (!start || !end || !sourceGrid) return [];

  const values = [];
  const fromRow = Math.min(start.row, end.row);
  const toRow = Math.max(start.row, end.row);
  const fromCol = Math.min(start.col, end.col);
  const toCol = Math.max(start.col, end.col);

  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      values.push(getCellRawValue(sourceGrid, makeCellId(row, col), context, sheetPrefix, visited));
    }
  }

  return values;
}

function getRangeMatrixValues(grid, startId, endId, context, sheetPrefix = '', visited = new Set()) {
  const sourceGrid = sheetPrefix ? getContextGrid(context, sheetPrefix) : grid;
  const start = parseCellId(startId);
  const end = parseCellId(endId);
  if (!start || !end || !sourceGrid) return [];

  const matrix = [];
  const fromRow = Math.min(start.row, end.row);
  const toRow = Math.max(start.row, end.row);
  const fromCol = Math.min(start.col, end.col);
  const toCol = Math.max(start.col, end.col);

  for (let row = fromRow; row <= toRow; row += 1) {
    const line = [];
    for (let col = fromCol; col <= toCol; col += 1) {
      line.push(getCellRawValue(sourceGrid, makeCellId(row, col), context, sheetPrefix, visited));
    }
    matrix.push(line);
  }

  return matrix;
}

function stripFormulaSpaces(expression = '') {
  let result = '';
  let quote = '';

  for (let index = 0; index < String(expression).length; index += 1) {
    const char = String(expression)[index];

    if ((char === '"' || char === "'") && String(expression)[index - 1] !== '\\') {
      quote = quote === char ? '' : quote || char;
      result += char;
      continue;
    }

    if (!quote && /\s/.test(char)) continue;
    result += char;
  }

  return result;
}

function isNumericValue(value) {
  if (value === null || value === undefined || value === '') return false;
  const clean = String(value).replace(/[$,%]/g, '').trim();
  return clean !== '' && Number.isFinite(Number(clean));
}

function toComparableValue(value) {
  if (isNumericValue(value)) return toNumber(value);
  if (value === null || value === undefined) return '';
  return String(value);
}

function jsLiteral(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (isNumericValue(value)) return String(toNumber(value));
  return JSON.stringify(String(value));
}

function normalizeRangeValue(value) {
  if (value === '#CYCLE' || value === '#ERROR') return value;
  return value === null || value === undefined ? '' : value;
}

function isInsideQuotedString(source = '', offset = 0) {
  let quote = '';
  for (let index = 0; index < offset; index += 1) {
    const char = String(source)[index];
    if ((char === '"' || char === "'") && String(source)[index - 1] !== '\\') {
      quote = quote === char ? '' : quote || char;
    }
  }
  return Boolean(quote);
}

function flattenValues(values = []) {
  return values.flat ? values.flat(Infinity) : values.reduce((acc, value) => acc.concat(Array.isArray(value) ? flattenValues(value) : value), []);
}

function numberValues(values = []) {
  return flattenValues(values).filter(isNumericValue).map(toNumber);
}

function aggregateRange(functionName, rawValues = []) {
  const name = String(functionName || '').toUpperCase();
  const values = flattenValues(rawValues).map(normalizeRangeValue);
  const numericValues = values.filter(isNumericValue).map(toNumber);

  if (name === 'SUM') return numericValues.reduce((sum, value) => sum + value, 0);
  if (name === 'AVG' || name === 'AVERAGE') return numericValues.length ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length : 0;
  if (name === 'MIN') return numericValues.length ? Math.min(...numericValues) : 0;
  if (name === 'MAX') return numericValues.length ? Math.max(...numericValues) : 0;
  if (name === 'COUNT') return numericValues.length;
  if (name === 'COUNTA') return values.filter((value) => value !== '').length;
  if (name === 'PRODUCT') return numericValues.length ? numericValues.reduce((total, value) => total * value, 1) : 0;

  return 0;
}

function replaceRangeFunctions(expression, grid, context, visited) {
  const rangeFunctionPattern = /\b(SUM|AVG|AVERAGE|MIN|MAX|COUNT|COUNTA|PRODUCT)\s*\(\s*((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)\s*!\s*)?(\$?[A-Z]+\$?\d+)\s*:\s*(\$?[A-Z]+\$?\d+)\s*\)/gi;

  return expression.replace(rangeFunctionPattern, (_, fn, sheetPrefix = '', startId, endId) => {
    const cleanSheetPrefix = sheetPrefix ? sheetPrefix.replace(/\s*!\s*$/, '!') : '';
    const values = getRangeValues(grid, startId, endId, context, cleanSheetPrefix, visited);
    return String(aggregateRange(fn, values));
  });
}

function replaceRangeReferences(expression, grid, context, visited) {
  const rangePattern = /((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)\s*!\s*)?(\$?[A-Z]+\$?\d+)\s*:\s*(\$?[A-Z]+\$?\d+)/gi;

  return String(expression).replace(rangePattern, (fullMatch, sheetPrefix = '', startId, endId, offset, source) => {
    if (isInsideQuotedString(source, offset)) return fullMatch;
    const cleanSheetPrefix = sheetPrefix ? sheetPrefix.replace(/\s*!\s*$/, '!') : '';
    const matrix = getRangeMatrixValues(grid, startId, endId, context, cleanSheetPrefix, visited);
    return JSON.stringify(matrix.map((row) => row.map((value) => normalizeRangeValue(value))));
  });
}

function normalizeExcelOperators(expression = '') {
  return String(expression)
    .replace(/;/g, ',')
    .replace(/<>/g, '!=')
    .replace(/&/g, '+')
    .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
    .replace(/\^/g, '**')
    .replace(/(?<![<>=!])=(?!=)/g, '===');
}

function normalizeFunctionNames(expression = '') {
  const functionMap = {
    SUMA: 'SUM',
    PROMEDIO: 'AVERAGE', PRODUCT: 'PRODUCT', PRODUCTO: 'PRODUCT', GCD: 'GCD', MCD: 'GCD', LCM: 'LCM', MCM: 'LCM',
    IF: 'IF', SI: 'IF', IFS: 'IFS', SI_CONJUNTO: 'IFS', IFERROR: 'IFERROR', SI_ERROR: 'IFERROR',
    ROUND: 'ROUND', REDONDEAR: 'ROUND', ROUNDUP: 'ROUNDUP', REDONDEAR_MAS: 'ROUNDUP', ROUNDDOWN: 'ROUNDDOWN', REDONDEAR_MENOS: 'ROUNDDOWN',
    ABS: 'ABS', SQRT: 'SQRT', RAIZ: 'SQRT', POWER: 'POWER', POTENCIA: 'POWER', MOD: 'MOD', INT: 'INT', TRUNC: 'TRUNC', MROUND: 'MROUND', MULTIPLO_REDONDEAR: 'MROUND', EVEN: 'EVEN', PAR: 'EVEN', ODD: 'ODD', IMPAR: 'ODD', SIGN: 'SIGN', SIGNO: 'SIGN',
    CEILING: 'CEILING', TECHO: 'CEILING', FLOOR: 'FLOOR', PISO: 'FLOOR',
    RAND: 'RAND', ALEATORIO: 'RAND', RANDBETWEEN: 'RANDBETWEEN', ALEATORIO_ENTRE: 'RANDBETWEEN',
    PI: 'PI', SIN: 'SIN', SENO: 'SIN', COS: 'COS', TAN: 'TAN', ASIN: 'ASIN', ACOS: 'ACOS', ATAN: 'ATAN', LOG: 'LOG', LN: 'LN', EXP: 'EXP', DEGREES: 'DEGREES', GRADOS: 'DEGREES', RADIANS: 'RADIANS', RADIANES: 'RADIANS',
    TODAY: 'TODAY', HOY: 'TODAY', NOW: 'NOW', AHORA: 'NOW', DATE: 'DATE', FECHA: 'DATE', DAY: 'DAY', DIA: 'DAY', MONTH: 'MONTH', MES: 'MONTH', YEAR: 'YEAR', AÑO: 'YEAR', ANO: 'YEAR', DAYS: 'DAYS', DIAS: 'DAYS', EDATE: 'EDATE', FECHA_MES: 'EDATE', EOMONTH: 'EOMONTH', FIN_MES: 'EOMONTH', WEEKDAY: 'WEEKDAY', DIASEM: 'WEEKDAY', WEEKNUM: 'WEEKNUM', NUM_DE_SEMANA: 'WEEKNUM', HOUR: 'HOUR', HORA: 'HOUR', MINUTE: 'MINUTE', MINUTO: 'MINUTE', SECOND: 'SECOND', SEGUNDO: 'SECOND',
    LEN: 'LEN', LARGO: 'LEN', CONCAT: 'CONCAT', CONCATENATE: 'CONCAT', CONCATENAR: 'CONCAT', TEXTJOIN: 'TEXTJOIN', UNIRCADENAS: 'TEXTJOIN',
    LEFT: 'LEFT', IZQUIERDA: 'LEFT', RIGHT: 'RIGHT', DERECHA: 'RIGHT', MID: 'MID', EXTRAE: 'MID',
    UPPER: 'UPPER', MAYUSC: 'UPPER', LOWER: 'LOWER', MINUSC: 'LOWER', PROPER: 'PROPER', NOMPROPIO: 'PROPER',
    TRIM: 'TRIM', ESPACIOS: 'TRIM', CLEAN: 'CLEAN', LIMPIAR: 'CLEAN', REPT: 'REPT', REPETIR: 'REPT',
    FIND: 'FIND', ENCONTRAR: 'FIND', SEARCH: 'SEARCH', HALLAR: 'SEARCH', SUBSTITUTE: 'SUBSTITUTE', SUSTITUIR: 'SUBSTITUTE', REPLACE: 'REPLACE', REEMPLAZAR: 'REPLACE', VALUE: 'VALUE', VALOR: 'VALUE', EXACT: 'EXACT', IGUAL: 'EXACT', PMT: 'PMT', PAGO: 'PMT',
    AND: 'AND', Y: 'AND', OR: 'OR', O: 'OR', XOR: 'XOR', NOT: 'NOT', NO: 'NOT', ISBLANK: 'ISBLANK', ESBLANCO: 'ISBLANK', ISNUMBER: 'ISNUMBER', ESNUMERO: 'ISNUMBER', ISTEXT: 'ISTEXT', ESTEXTO: 'ISTEXT', ISERROR: 'ISERROR', ESERROR: 'ISERROR', ISNA: 'ISNA', ESNOD: 'ISNA',
    MEDIAN: 'MEDIAN', MEDIANA: 'MEDIAN', MODE: 'MODE', MODA: 'MODE', STDEV: 'STDEV', DESVEST: 'STDEV', VAR: 'VAR', LARGE: 'LARGE', K_ESIMO_MAYOR: 'LARGE', SMALL: 'SMALL', K_ESIMO_MENOR: 'SMALL', RANK: 'RANK', JERARQUIA: 'RANK', PERCENTILE: 'PERCENTILE', PERCENTIL: 'PERCENTILE', QUARTILE: 'QUARTILE', CUARTIL: 'QUARTILE',
    SUMIF: 'SUMIF', SUMAR_SI: 'SUMIF', COUNTIF: 'COUNTIF', CONTAR: 'COUNT', CONTARA: 'COUNTA', CONTAR_SI: 'COUNTIF', CONTAR_SI_CONJUNTO: 'COUNTIFS', COUNTIFS: 'COUNTIFS', AVERAGEIF: 'AVERAGEIF', PROMEDIO_SI: 'AVERAGEIF', AVERAGEIFS: 'AVERAGEIFS', PROMEDIO_SI_CONJUNTO: 'AVERAGEIFS', SUMIFS: 'SUMIFS', SUMAR_SI_CONJUNTO: 'SUMIFS', MAXIFS: 'MAXIFS', MINIFS: 'MINIFS',
    INDEX: 'INDEX', INDICE: 'INDEX', MATCH: 'MATCH', COINCIDIR: 'MATCH', VLOOKUP: 'VLOOKUP', BUSCARV: 'VLOOKUP', HLOOKUP: 'HLOOKUP', BUSCARH: 'HLOOKUP', XLOOKUP: 'XLOOKUP', BUSCARX: 'XLOOKUP', CHOOSE: 'CHOOSE', ELEGIR: 'CHOOSE', SWITCH: 'SWITCH', CAMBIAR: 'SWITCH',
    PV: 'PV', VA: 'PV', FV: 'FV', VF: 'FV', NPER: 'NPER', RATE: 'RATE', TASA: 'RATE', IPMT: 'IPMT', PAGOINT: 'IPMT', PAGO_INT: 'IPMT', PPMT: 'PPMT', PAGOPRIN: 'PPMT', PAGO_PRIN: 'PPMT', CUMIPMT: 'CUMIPMT', PAGO_INT_ENTRE: 'CUMIPMT', CUMPRINC: 'CUMPRINC', PAGO_PRINC_ENTRE: 'CUMPRINC', NPV: 'NPV', VNA: 'NPV', IRR: 'IRR', TIR: 'IRR', MIRR: 'MIRR', TIRM: 'MIRR', SLN: 'SLN', SYD: 'SYD', DDB: 'DDB', DB: 'DB', EFFECT: 'EFFECT', INT_EFECTIVO: 'EFFECT', NOMINAL: 'NOMINAL', TASA_NOMINAL: 'NOMINAL', RRI: 'RRI', PDURATION: 'PDURATION', DURACION_P: 'PDURATION', FVSCHEDULE: 'FVSCHEDULE', VF_PLAN: 'FVSCHEDULE',
    DAYS360: 'DAYS360', DIAS360: 'DAYS360', NETWORKDAYS: 'NETWORKDAYS', DIAS_LAB: 'NETWORKDAYS', WORKDAY: 'WORKDAY', DIA_LAB: 'WORKDAY', YEARFRAC: 'YEARFRAC', FRAC_AÑO: 'YEARFRAC', FRAC_ANO: 'YEARFRAC', DATEDIF: 'DATEDIF', SIFECHA: 'DATEDIF',
    IVA: 'IVA', PRECIOCONIVA: 'PRECIOCONIVA', CONIVA: 'PRECIOCONIVA', SINIVA: 'SINIVA', SUBTOTALIVA: 'SINIVA', IMPUESTO: 'IMPUESTO', TAX: 'IMPUESTO', DESCUENTO: 'DESCUENTO', DISCOUNT: 'DESCUENTO', MONTO_DESCUENTO: 'MONTO_DESCUENTO', DISCOUNTAMOUNT: 'MONTO_DESCUENTO', MARGEN: 'MARGEN', MARGIN: 'MARGEN', MARKUP: 'MARKUP', RECARGO: 'MARKUP', UTILIDAD: 'UTILIDAD', UTILIDADPORC: 'UTILIDADPORC', UTILIDAD_PORC: 'UTILIDADPORC', COSTO_TOTAL: 'COSTO_TOTAL', COSTOTOTAL: 'COSTO_TOTAL', VENTA_TOTAL: 'VENTA_TOTAL', VENTATOTAL: 'VENTA_TOTAL', PUNTOEQUILIBRIO: 'PUNTOEQUILIBRIO', BREAK_EVEN: 'PUNTOEQUILIBRIO', ROTACION: 'ROTACION', ROTACION_INVENTARIO: 'ROTACION', DIASCARTERA: 'DIASCARTERA', DSO: 'DIASCARTERA', RAZONCORRIENTE: 'RAZONCORRIENTE', CURRENT_RATIO: 'RAZONCORRIENTE', PRUEBAACIDA: 'PRUEBAACIDA', QUICK_RATIO: 'PRUEBAACIDA', ENDEUDAMIENTO: 'ENDEUDAMIENTO', DEBT_RATIO: 'ENDEUDAMIENTO', ROI: 'ROI', ROA: 'ROA', ROE: 'ROE',

    SUBTOTAL: 'SUBTOTAL', SUBTOTALES: 'SUBTOTAL', SUMPRODUCT: 'SUMPRODUCT', SUMAPRODUCTO: 'SUMPRODUCT', COUNTBLANK: 'COUNTBLANK', CONTAR_BLANCO: 'COUNTBLANK', FREQUENCY: 'FREQUENCY', FRECUENCIA: 'FREQUENCY', PERCENTRANK: 'PERCENTRANK', RANGO_PERCENTIL: 'PERCENTRANK', COVARIANCE: 'COVARIANCE', COVARIANZA: 'COVARIANCE', CORREL: 'CORREL', COEF_DE_CORREL: 'CORREL', GEOMEAN: 'GEOMEAN', MEDIA_GEOM: 'GEOMEAN', HARMEAN: 'HARMEAN', MEDIA_ARMO: 'HARMEAN',
    XNPV: 'XNPV', VNA_NO_PER: 'XNPV', XIRR: 'XIRR', TIR_NO_PER: 'XIRR', DISC: 'DISC', TASA_DESC: 'DISC', INTRATE: 'INTRATE', TASA_INT: 'INTRATE', RECEIVED: 'RECEIVED', CANTIDAD_RECIBIDA: 'RECEIVED', DURATION: 'DURATION', DURACION: 'DURATION', MDURATION: 'MDURATION', DURACION_MODIF: 'MDURATION', PRICEDISC: 'PRICEDISC', PRECIO_DESCUENTO: 'PRICEDISC', YIELDDISC: 'YIELDDISC', RENDTO_DESCUENTO: 'YIELDDISC', TBILLEQ: 'TBILLEQ', LETRA_DE_TES_EQV_A_BONO: 'TBILLEQ', TBILLPRICE: 'TBILLPRICE', LETRA_DE_TES_PRECIO: 'TBILLPRICE', TBILLYIELD: 'TBILLYIELD', LETRA_DE_TES_RENDTO: 'TBILLYIELD',
    SUBTOTAL_FACTURA: 'SUBTOTAL_FACTURA', BASE_FACTURA: 'SUBTOTAL_FACTURA', TOTAL_FACTURA: 'TOTAL_FACTURA', TOTALCFDI: 'TOTAL_FACTURA', RETENCION_IVA: 'RETENCION_IVA', RETIVA: 'RETENCION_IVA', RETENCION_ISR: 'RETENCION_ISR', RETISR: 'RETENCION_ISR', IVA16: 'IVA16', IVA_16: 'IVA16', IVA8: 'IVA8', IVA_8: 'IVA8', BASE_DESDE_TOTAL: 'BASE_DESDE_TOTAL', BASE_TOTAL: 'BASE_DESDE_TOTAL', REDONDEO_FISCAL: 'REDONDEO_FISCAL', REDONDEO: 'REDONDEO_FISCAL',
    DIFERENCIA: 'DIFERENCIA', DIF: 'DIFERENCIA', CONCILIADO: 'CONCILIADO', MATCH_CONTABLE: 'CONCILIADO', SALDO: 'SALDO', BALANCE_CONTABLE: 'SALDO', DEUDOR_ACREEDOR: 'DEUDOR_ACREEDOR', NATURALEZA_SALDO: 'DEUDOR_ACREEDOR', VARIACION: 'VARIACION', CAMBIO: 'VARIACION', VARIACIONPORC: 'VARIACIONPORC', CAMBIO_PORC: 'VARIACIONPORC', PORCENTAJE: 'PORCENTAJE', PORC: 'PORCENTAJE', PROMEDIO_PONDERADO: 'PROMEDIO_PONDERADO', MEDIA_PONDERADA: 'PROMEDIO_PONDERADO', COSTO_PROMEDIO: 'COSTO_PROMEDIO', CPP: 'COSTO_PROMEDIO',
    MARGEN_BRUTO: 'MARGEN_BRUTO', GROSS_MARGIN: 'MARGEN_BRUTO', MARGEN_OPERATIVO: 'MARGEN_OPERATIVO', OPERATING_MARGIN: 'MARGEN_OPERATIVO', MARGEN_NETO: 'MARGEN_NETO', NET_MARGIN: 'MARGEN_NETO', EBITDA: 'EBITDA', EBITDA_MARGEN: 'EBITDA_MARGEN', EBITDA_MARGIN: 'EBITDA_MARGEN', CAPITAL_TRABAJO: 'CAPITAL_TRABAJO', WORKING_CAPITAL: 'CAPITAL_TRABAJO', APALANCAMIENTO: 'APALANCAMIENTO', LEVERAGE: 'APALANCAMIENTO', COBERTURA_INTERESES: 'COBERTURA_INTERESES', INTEREST_COVERAGE: 'COBERTURA_INTERESES', CICLO_CONVERSION_EFECTIVO: 'CICLO_CONVERSION_EFECTIVO', CCE: 'CICLO_CONVERSION_EFECTIVO', DIO: 'DIO', DIAS_INVENTARIO: 'DIO', DPO: 'DPO', DIAS_PROVEEDORES: 'DPO',
    VENCIDO: 'VENCIDO', ESTA_VENCIDO: 'VENCIDO', DIAS_VENCIDO: 'DIAS_VENCIDO', DIAS_MORA: 'DIAS_VENCIDO', ANTIGUEDAD_CARTERA: 'ANTIGUEDAD_CARTERA', AGING: 'ANTIGUEDAD_CARTERA', PROVISION_CARTERA: 'PROVISION_CARTERA', PROVISION_CXC: 'PROVISION_CARTERA', INTERES_MORATORIO: 'INTERES_MORATORIO', MORA: 'INTERES_MORATORIO', DESCUENTO_PRONTO_PAGO: 'DESCUENTO_PRONTO_PAGO', PRONTO_PAGO: 'DESCUENTO_PRONTO_PAGO', NOMINA_NETA: 'NOMINA_NETA', SUELDO_NETO: 'NOMINA_NETA', COMISION: 'COMISION', COMISION_VENTA: 'COMISION', PRESUPUESTO_VARIACION: 'PRESUPUESTO_VARIACION', VAR_PRESUPUESTO: 'PRESUPUESTO_VARIACION', PRESUPUESTO_VARIACION_PORC: 'PRESUPUESTO_VARIACION_PORC', VAR_PRESUPUESTO_PORC: 'PRESUPUESTO_VARIACION_PORC',

    AVERAGEA: 'AVERAGEA', PROMEDIOA: 'AVERAGEA', MAXA: 'MAXA', MINA: 'MINA', SUMSQ: 'SUMSQ', SUMA_CUADRADOS: 'SUMSQ', DEVSQ: 'DEVSQ', DESVIA2: 'DEVSQ', AVEDEV: 'AVEDEV', DESVPROM: 'AVEDEV', AGGREGATE: 'AGGREGATE', AGREGAR: 'AGGREGATE',
    TEXT: 'TEXT', TEXTO: 'TEXT', FIXED: 'FIXED', DECIMAL: 'FIXED', DOLLAR: 'DOLLAR', MONEDA: 'DOLLAR', NUMBERVALUE: 'NUMBERVALUE', VALOR_NUMERO: 'NUMBERVALUE', DATEVALUE: 'DATEVALUE', FECHANUMERO: 'DATEVALUE', TIMEVALUE: 'TIMEVALUE', HORANUMERO: 'TIMEVALUE',
    WORKDAY_INTL: 'WORKDAY_INTL', DIA_LAB_INTL: 'WORKDAY_INTL', NETWORKDAYS_INTL: 'NETWORKDAYS_INTL', DIAS_LAB_INTL: 'NETWORKDAYS_INTL',
    EFFECTIVE_MONTHLY_RATE: 'EFFECTIVE_MONTHLY_RATE', TASA_EFECTIVA_MENSUAL: 'EFFECTIVE_MONTHLY_RATE', EFFECTIVE_ANNUAL_RATE: 'EFFECTIVE_ANNUAL_RATE', TASA_EFECTIVA_ANUAL: 'EFFECTIVE_ANNUAL_RATE', SIMPLE_INTEREST: 'SIMPLE_INTEREST', INTERES_SIMPLE: 'SIMPLE_INTEREST', COMPOUND_INTEREST: 'COMPOUND_INTEREST', INTERES_COMPUESTO: 'COMPOUND_INTEREST', FINAL_CAPITAL: 'FINAL_CAPITAL', CAPITAL_FINAL: 'FINAL_CAPITAL', INITIAL_CAPITAL: 'INITIAL_CAPITAL', CAPITAL_INICIAL: 'INITIAL_CAPITAL',
    IVA_POR_PAGAR: 'IVA_POR_PAGAR', IVA_TRASLADADO: 'IVA_TRASLADADO', IVA_ACREDITABLE: 'IVA_ACREDITABLE', HONORARIOS_NETO: 'HONORARIOS_NETO', ISR_PROVISIONAL: 'ISR_PROVISIONAL', CONTRIBUCION_UNITARIA: 'CONTRIBUCION_UNITARIA', MARGEN_CONTRIBUCION: 'MARGEN_CONTRIBUCION', PUNTO_EQUILIBRIO_VENTAS: 'PUNTO_EQUILIBRIO_VENTAS',
    DEPRECIACION_MENSUAL: 'DEPRECIACION_MENSUAL', DEPRECIACION_ACUMULADA: 'DEPRECIACION_ACUMULADA', VALOR_LIBROS: 'VALOR_LIBROS', SALDO_FINAL: 'SALDO_FINAL', CUADRA_DEBE_HABER: 'CUADRA_DEBE_HABER', CONCILIACION_BANCARIA: 'CONCILIACION_BANCARIA', SALDO_INSOLUTO: 'SALDO_INSOLUTO', PAYBACK: 'PAYBACK', RECUPERACION: 'PAYBACK', PROFIT_FACTOR: 'PROFIT_FACTOR', FACTOR_GANANCIA: 'PROFIT_FACTOR',
    COUPDAYS: 'COUPDAYS', CUPON_DIAS: 'COUPDAYS', COUPDAYBS: 'COUPDAYBS', CUPON_DIAS_L1: 'COUPDAYBS', COUPDAYSNC: 'COUPDAYSNC', CUPON_DIAS_L2: 'COUPDAYSNC', COUPNUM: 'COUPNUM', CUPON_NUM: 'COUPNUM', ACCRINTM: 'ACCRINTM', INT_ACUM_V: 'ACCRINTM', ACCRINT: 'ACCRINT', INT_ACUM: 'ACCRINT',
    FILTER: 'FILTER', FILTRAR: 'FILTER', UNIQUE: 'UNIQUE', UNICOS: 'UNIQUE', SORT: 'SORT', ORDENAR: 'SORT', TAKE: 'TAKE', TOMAR: 'TAKE', DROP: 'DROP', SOLTAR: 'DROP',
    STDEV_S: 'STDEV_S', DESVEST_M: 'STDEV_S', STDEV_P: 'STDEV_P', DESVEST_P: 'STDEV_P', VAR_S: 'VAR_S', VAR_P: 'VAR_P', PERCENTILE_INC: 'PERCENTILE_INC', PERCENTIL_INC: 'PERCENTILE_INC', PERCENTILE_EXC: 'PERCENTILE_EXC', PERCENTIL_EXC: 'PERCENTILE_EXC', QUARTILE_INC: 'QUARTILE_INC', CUARTIL_INC: 'QUARTILE_INC', QUARTILE_EXC: 'QUARTILE_EXC', CUARTIL_EXC: 'QUARTILE_EXC', PERCENTRANK_INC: 'PERCENTRANK_INC', RANGO_PERCENTIL_INC: 'PERCENTRANK_INC', PERCENTRANK_EXC: 'PERCENTRANK_EXC', RANGO_PERCENTIL_EXC: 'PERCENTRANK_EXC', STANDARDIZE: 'STANDARDIZE', NORMALIZACION: 'STANDARDIZE', NORM_DIST: 'NORM_DIST', DISTR_NORM_N: 'NORM_DIST', NORM_S_DIST: 'NORM_S_DIST', DISTR_NORM_ESTAND_N: 'NORM_S_DIST', NORM_INV: 'NORM_INV', INV_NORM: 'NORM_INV', NORM_S_INV: 'NORM_S_INV', INV_NORM_ESTAND: 'NORM_S_INV',
    FORECAST_LINEAR: 'FORECAST_LINEAR', PRONOSTICO_LINEAL: 'FORECAST_LINEAR', FORECAST_ETS: 'FORECAST_ETS', PRONOSTICO_ETS: 'FORECAST_ETS', SLOPE: 'SLOPE', PENDIENTE: 'SLOPE', INTERCEPT: 'INTERCEPT', INTERSECCION_EJE: 'INTERCEPT', RSQ: 'RSQ', COEFICIENTE_R2: 'RSQ', ISPMT: 'ISPMT', PAGO_INT_SIMPLE: 'ISPMT', CAGR: 'CAGR', TCAC: 'CAGR', GROWTH_RATE: 'GROWTH_RATE', TASA_CRECIMIENTO: 'GROWTH_RATE', DIAS_COBRANZA: 'DSO', INVENTORY_TURNOVER: 'INVENTORY_TURNOVER', INV_TURNOVER: 'INVENTORY_TURNOVER', ASSET_TURNOVER: 'ASSET_TURNOVER', ROTACION_ACTIVOS: 'ASSET_TURNOVER', DEBT_TO_EQUITY: 'DEBT_TO_EQUITY', DEUDA_CAPITAL: 'DEBT_TO_EQUITY',
    GROSS_PROFIT: 'GROSS_PROFIT', UTILIDAD_BRUTA: 'GROSS_PROFIT', OPERATING_PROFIT: 'OPERATING_PROFIT', UTILIDAD_OPERATIVA: 'OPERATING_PROFIT', NET_PROFIT: 'NET_PROFIT', UTILIDAD_NETA: 'NET_PROFIT', BREAK_EVEN_UNITS: 'BREAK_EVEN_UNITS', PUNTO_EQUILIBRIO_UNIDADES: 'BREAK_EVEN_UNITS', SAFETY_MARGIN: 'SAFETY_MARGIN', MARGEN_SEGURIDAD: 'SAFETY_MARGIN', VAT_INCLUDED_RATE: 'VAT_INCLUDED_RATE', TASA_DESDE_TOTAL: 'VAT_INCLUDED_RATE', PRORATE: 'PRORATE', PRORRATEAR: 'PRORATE', ALLOCATE_BY_WEIGHT: 'ALLOCATE_BY_WEIGHT', ASIGNAR_POR_PESO: 'ALLOCATE_BY_WEIGHT', AGING_BUCKET: 'AGING_BUCKET', RANGO_ANTIGUEDAD: 'AGING_BUCKET',
    TEXTBEFORE: 'TEXTBEFORE', TEXTOANTES: 'TEXTBEFORE', TEXTAFTER: 'TEXTAFTER', TEXTODESPUES: 'TEXTAFTER', TEXTSPLIT: 'TEXTSPLIT', DIVIDIRTEXTO: 'TEXTSPLIT', TRIMMEAN: 'TRIMMEAN', MEDIA_ACOTADA: 'TRIMMEAN', CHOOSECOLS: 'CHOOSECOLS', ELEGIRCOLS: 'CHOOSECOLS', CHOOSEROWS: 'CHOOSEROWS', ELEGIRFILAS: 'CHOOSEROWS', TRANSPOSE: 'TRANSPOSE', TRANSPONER: 'TRANSPOSE', HSTACK: 'HSTACK', APILARH: 'HSTACK', VSTACK: 'VSTACK', APILARV: 'VSTACK', XMATCH: 'XMATCH', COINCIDIRX: 'XMATCH', ISLOGICAL: 'ISLOGICAL', ESLOGICO: 'ISLOGICAL', ISEVEN: 'ISEVEN', ESPAR: 'ISEVEN', ISODD: 'ISODD', ESIMPAR: 'ISODD', ISNONTEXT: 'ISNONTEXT', ESNOTEXTO: 'ISNONTEXT', ISOWEEKNUM: 'ISOWEEKNUM', NUM_SEMANA_ISO: 'ISOWEEKNUM',
    FACT: 'FACT', FACTDOUBLE: 'FACTDOUBLE', FACT_DOBLE: 'FACTDOUBLE', COMBIN: 'COMBIN', COMBINAT: 'COMBIN', COMBINA: 'COMBINA', PERMUT: 'PERMUT', PERMUTACIONES: 'PERMUT', PERMUTATIONA: 'PERMUTATIONA', PERMUTACIONES_A: 'PERMUTATIONA', MULTINOMIAL: 'MULTINOMIAL', QUOTIENT: 'QUOTIENT', COCIENTE: 'QUOTIENT', BASE: 'BASE', DECIMAL: 'DECIMAL', ROMAN: 'ROMAN', ROMANO: 'ROMAN', ARABIC: 'ARABIC', ARABIGO: 'ARABIC', CEILING_MATH: 'CEILING_MATH', MULTIPLO_SUPERIOR_MAT: 'CEILING_MATH', FLOOR_MATH: 'FLOOR_MATH', MULTIPLO_INFERIOR_MAT: 'FLOOR_MATH', ISO_CEILING: 'ISO_CEILING', ISO_MULTIPLO_SUPERIOR: 'ISO_CEILING', TIME: 'TIME', ISDATE: 'ISDATE', ESFECHA: 'ISDATE', IFNA: 'IFNA', SI_ND: 'IFNA', ISERR: 'ISERR', ESERR: 'ISERR', ISFORMULA: 'ISFORMULA', ESFORMULA: 'ISFORMULA', N: 'N', T: 'T', CHAR: 'CHAR', CARACTER: 'CHAR', CODE: 'CODE', CODIGO: 'CODE', UNICHAR: 'UNICHAR', UNICARACTER: 'UNICHAR', UNICODE: 'UNICODE', RECEIVED_RATE: 'RECEIVED_RATE', TASA_RECIBIDA: 'RECEIVED_RATE', EFFECTIVE_RATE_PERIOD: 'EFFECTIVE_RATE_PERIOD', TASA_EFECTIVA_PERIODO: 'EFFECTIVE_RATE_PERIOD', AMORTIZATION_PAYMENT: 'AMORTIZATION_PAYMENT', PAGO_AMORTIZACION: 'AMORTIZATION_PAYMENT', RUNNING_TOTAL: 'RUNNING_TOTAL', ACUMULADO: 'RUNNING_TOTAL', PERCENT_OF_TOTAL: 'PERCENT_OF_TOTAL', PORC_DEL_TOTAL: 'PERCENT_OF_TOTAL', WEIGHTED_AVERAGE: 'WEIGHTED_AVERAGE', SEQUENCE: 'SEQUENCE', SECUENCIA: 'SEQUENCE', TOCOL: 'TOCOL', ACOLUMNA: 'TOCOL', TOROW: 'TOROW', AFILA: 'TOROW', WRAPROWS: 'WRAPROWS', AJUSTARFILAS: 'WRAPROWS', WRAPCOLS: 'WRAPCOLS', AJUSTARCOLS: 'WRAPCOLS',
  };

  return String(expression).replace(/\b([A-ZÁÉÍÓÚÑ._]+)\s*\(/gi, (match, name) => {
    const normalized = functionMap[String(name).toUpperCase().replace(/\./g, '_')];
    return normalized ? `${normalized}(` : match;
  });
}

function replaceCellReferences(expression, grid, context, visited) {
  const cellReferencePattern = /((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)\s*!\s*)?(\$?[A-Z]+\$?\d+)/gi;

  return String(expression).replace(cellReferencePattern, (fullMatch, sheetPrefix = '', cellId, offset, source) => {
    if (isInsideQuotedString(source, offset)) return fullMatch;

    const before = source[offset - 1] || '';
    const after = source[offset + fullMatch.length] || '';

    // Evita reemplazar textos tipo nombres de funciones, palabras pegadas o funciones con números como DAYS360.
    if (after === '(' || /[A-Z0-9_ÁÉÍÓÚÑ]/i.test(before) || /[A-Z0-9_ÁÉÍÓÚÑ]/i.test(after)) return fullMatch;

    const cleanSheetPrefix = sheetPrefix ? sheetPrefix.replace(/\s*!\s*$/, '!') : '';
    const value = getCellRawValue(grid, cellId, context, cleanSheetPrefix, visited);
    return jsLiteral(value);
  });
}

function formatFormulaResult(result) {
  if (result instanceof Date) return result.toLocaleDateString('es-MX');
  if (typeof result === 'boolean') return result ? 'TRUE' : 'FALSE';
  if (result === null || result === undefined) return '';
  if (Number.isFinite(result)) return String(result);
  return String(result);
}

function makeDate(value) {
  if (value instanceof Date) return value;
  if (isNumericValue(value)) return new Date(Math.round((toNumber(value) - 25569) * 86400 * 1000));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date('') : date;
}

function compareCriterion(value, criterion) {
  const text = String(criterion ?? '').trim();
  const match = text.match(/^(>=|<=|<>|!=|>|<|=)?\s*(.*)$/);
  const operator = match?.[1] || '=';
  const expectedRaw = match?.[2] ?? '';
  const left = isNumericValue(value) && isNumericValue(expectedRaw) ? toNumber(value) : String(value ?? '').toLowerCase();
  const right = isNumericValue(value) && isNumericValue(expectedRaw) ? toNumber(expectedRaw) : String(expectedRaw).toLowerCase();

  if (operator === '>' ) return left > right;
  if (operator === '<' ) return left < right;
  if (operator === '>=') return left >= right;
  if (operator === '<=') return left <= right;
  if (operator === '<>' || operator === '!=') return left !== right;
  if (String(right).includes('*')) {
    const pattern = new RegExp(`^${String(right).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`, 'i');
    return pattern.test(String(value ?? ''));
  }
  return left === right;
}

function matrixRows(value) {
  if (!Array.isArray(value)) return [[value]];
  if (!Array.isArray(value[0])) return [value];
  return value;
}

function atMatrix(value, rowIndex, colIndex = 0) {
  const rows = matrixRows(value);
  return rows[rowIndex]?.[colIndex] ?? '';
}


function criteriaFilter(targetRange, criteriaPairs = []) {
  const targets = flattenValues([targetRange]);
  return targets.filter((_, index) => criteriaPairs.every(([range, criterion]) => compareCriterion(flattenValues([range])[index], criterion)));
}

function percentile(values, k = 0) {
  const nums = numberValues([values]).sort((a, b) => a - b);
  if (!nums.length) return '#N/A';
  const ratio = Math.min(1, Math.max(0, toNumber(k)));
  const index = (nums.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return nums[lower];
  return nums[lower] + (nums[upper] - nums[lower]) * (index - lower);
}

function gcdPair(a, b) {
  let x = Math.abs(Math.trunc(toNumber(a)));
  let y = Math.abs(Math.trunc(toNumber(b)));
  while (y) [x, y] = [y, x % y];
  return x;
}

function lcmPair(a, b) {
  const x = Math.abs(Math.trunc(toNumber(a)));
  const y = Math.abs(Math.trunc(toNumber(b)));
  if (!x || !y) return 0;
  return Math.abs(x * y) / gcdPair(x, y);
}

function addMonths(dateValue, months = 0, endOfMonth = false) {
  const date = makeDate(dateValue);
  if (Number.isNaN(date.getTime())) return '#VALUE!';
  const result = new Date(date.getFullYear(), date.getMonth() + Number(months || 0), date.getDate());
  if (endOfMonth) return new Date(result.getFullYear(), result.getMonth() + 1, 0);
  return result;
}

function weekNumber(dateValue) {
  const date = makeDate(dateValue);
  if (Number.isNaN(date.getTime())) return '#VALUE!';
  const first = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - first) / 86400000) + first.getDay() + 1) / 7);
}


function safeDivide(numerator, denominator, fallback = '#DIV/0!') {
  const den = toNumber(denominator);
  if (!den) return fallback;
  return toNumber(numerator) / den;
}

function normalizeRate(rate) {
  const value = toNumber(rate);
  return Math.abs(value) > 1 ? value / 100 : value;
}

function financePmt(rate, nper, pv, fv = 0, type = 0) {
  const r = normalizeRate(rate);
  const periods = toNumber(nper);
  const present = toNumber(pv);
  const future = toNumber(fv);
  const when = toNumber(type);
  if (!periods) return '#DIV/0!';
  if (!r) return -(present + future) / periods;
  return -(r * (future + present * ((1 + r) ** periods))) / (((1 + r * when) * (((1 + r) ** periods) - 1)));
}

function financePv(rate, nper, pmt = 0, fv = 0, type = 0) {
  const r = normalizeRate(rate);
  const periods = toNumber(nper);
  const payment = toNumber(pmt);
  const future = toNumber(fv);
  const when = toNumber(type);
  if (!r) return -future - payment * periods;
  return -(future + payment * (1 + r * when) * (((1 + r) ** periods - 1) / r)) / ((1 + r) ** periods);
}

function financeFv(rate, nper, pmt = 0, pv = 0, type = 0) {
  const r = normalizeRate(rate);
  const periods = toNumber(nper);
  const payment = toNumber(pmt);
  const present = toNumber(pv);
  const when = toNumber(type);
  if (!r) return -(present + payment * periods);
  return -(present * ((1 + r) ** periods) + payment * (1 + r * when) * (((1 + r) ** periods - 1) / r));
}

function financeNper(rate, pmt, pv, fv = 0, type = 0) {
  const r = normalizeRate(rate);
  const payment = toNumber(pmt);
  const present = toNumber(pv);
  const future = toNumber(fv);
  const when = toNumber(type);
  if (!r) return safeDivide(-(present + future), payment);
  const numerator = payment * (1 + r * when) - future * r;
  const denominator = present * r + payment * (1 + r * when);
  if (numerator <= 0 || denominator <= 0) return '#NUM!';
  return Math.log(numerator / denominator) / Math.log(1 + r);
}

function financeRate(nper, pmt, pv, fv = 0, type = 0, guess = 0.1) {
  let rate = normalizeRate(guess);
  const periods = toNumber(nper);
  const payment = toNumber(pmt);
  const present = toNumber(pv);
  const future = toNumber(fv);
  const when = toNumber(type);
  for (let i = 0; i < 50; i += 1) {
    const f = present * ((1 + rate) ** periods) + payment * (1 + rate * when) * (((1 + rate) ** periods - 1) / rate) + future;
    const d = (present * periods * ((1 + rate) ** (periods - 1))) + payment * (((1 + rate * when) * ((periods * rate * ((1 + rate) ** (periods - 1))) - (((1 + rate) ** periods) - 1))) / (rate ** 2) + when * ((((1 + rate) ** periods) - 1) / rate));
    const next = rate - f / d;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
  }
  return rate;
}

function npv(rate, values) {
  const r = normalizeRate(rate);
  return flattenValues([values]).reduce((sum, value, index) => sum + toNumber(value) / ((1 + r) ** (index + 1)), 0);
}

function irr(values, guess = 0.1) {
  const cashflows = flattenValues([values]).map(toNumber);
  let rate = normalizeRate(guess);
  for (let i = 0; i < 80; i += 1) {
    let value = 0;
    let derivative = 0;
    cashflows.forEach((cashflow, period) => {
      value += cashflow / ((1 + rate) ** period);
      if (period > 0) derivative -= period * cashflow / ((1 + rate) ** (period + 1));
    });
    const next = rate - value / derivative;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
  }
  return rate;
}

function isHoliday(date, holidays = []) {
  const key = makeDate(date).toDateString();
  return flattenValues([holidays]).some((holiday) => makeDate(holiday).toDateString() === key);
}

function isBusinessDay(date, holidays = []) {
  const day = makeDate(date).getDay();
  return day !== 0 && day !== 6 && !isHoliday(date, holidays);
}

function networkDays(startDate, endDate, holidays = []) {
  const start = makeDate(startDate);
  const end = makeDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '#VALUE!';
  const step = start <= end ? 1 : -1;
  let count = 0;
  const current = new Date(start);
  while ((step > 0 && current <= end) || (step < 0 && current >= end)) {
    if (isBusinessDay(current, holidays)) count += step;
    current.setDate(current.getDate() + step);
  }
  return count;
}

function workDay(startDate, days = 0, holidays = []) {
  const current = makeDate(startDate);
  if (Number.isNaN(current.getTime())) return '#VALUE!';
  const step = toNumber(days) >= 0 ? 1 : -1;
  let remaining = Math.abs(Math.trunc(toNumber(days)));
  while (remaining > 0) {
    current.setDate(current.getDate() + step);
    if (isBusinessDay(current, holidays)) remaining -= 1;
  }
  return current;
}

function days360(startDate, endDate) {
  const start = makeDate(startDate);
  const end = makeDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '#VALUE!';
  const d1 = Math.min(start.getDate(), 30);
  const d2 = start.getDate() === 30 ? Math.min(end.getDate(), 30) : end.getDate();
  return (end.getFullYear() - start.getFullYear()) * 360 + (end.getMonth() - start.getMonth()) * 30 + (d2 - d1);
}

function yearFrac(startDate, endDate, basis = 0) {
  const start = makeDate(startDate);
  const end = makeDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '#VALUE!';
  if (Number(basis) === 1) {
    const days = (end - start) / 86400000;
    const years = end.getFullYear() - start.getFullYear() || 1;
    const avgYear = Array.from({ length: Math.abs(years) || 1 }, (_, i) => new Date(start.getFullYear() + i, 1, 29).getMonth() === 1 ? 366 : 365).reduce((a, b) => a + b, 0) / (Math.abs(years) || 1);
    return days / avgYear;
  }
  if (Number(basis) === 2) return (end - start) / 86400000 / 360;
  if (Number(basis) === 3) return (end - start) / 86400000 / 365;
  return days360(start, end) / 360;
}

function datedif(startDate, endDate, unit = 'D') {
  const start = makeDate(startDate);
  const end = makeDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '#VALUE!';
  const mode = String(unit || 'D').toUpperCase();
  if (mode === 'D') return Math.floor((end - start) / 86400000);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() - (end.getDate() < start.getDate() ? 1 : 0);
  if (mode === 'M') return months;
  if (mode === 'Y') return Math.floor(months / 12);
  if (mode === 'MD') return end.getDate() >= start.getDate() ? end.getDate() - start.getDate() : new Date(end.getFullYear(), end.getMonth(), 0).getDate() - start.getDate() + end.getDate();
  if (mode === 'YM') return months % 12;
  if (mode === 'YD') return Math.floor((new Date(start.getFullYear(), end.getMonth(), end.getDate()) - start) / 86400000);
  return '#VALUE!';
}

function ddb(cost, salvage, life, period, factor = 2) {
  let book = toNumber(cost);
  const residual = toNumber(salvage);
  const years = toNumber(life);
  const targetPeriod = Math.trunc(toNumber(period));
  let depreciation = 0;
  for (let current = 1; current <= targetPeriod; current += 1) {
    depreciation = Math.min(book * toNumber(factor) / years, book - residual);
    book -= depreciation;
  }
  return depreciation;
}


function dateDiffDays(startDate, endDate) {
  const start = makeDate(startDate);
  const end = makeDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return NaN;
  return (end - start) / 86400000;
}

function xnpv(rate, values, dates) {
  const r = normalizeRate(rate);
  const cashflows = flattenValues([values]).map(toNumber);
  const dateValues = flattenValues([dates]).map(makeDate);
  if (!cashflows.length || cashflows.length !== dateValues.length || dateValues.some((d) => Number.isNaN(d.getTime()))) return '#VALUE!';
  const first = dateValues[0];
  return cashflows.reduce((sum, cashflow, index) => sum + cashflow / ((1 + r) ** ((dateValues[index] - first) / 365 / 86400000)), 0);
}

function xirr(values, dates, guess = 0.1) {
  const cashflows = flattenValues([values]).map(toNumber);
  const dateValues = flattenValues([dates]).map(makeDate);
  if (!cashflows.length || cashflows.length !== dateValues.length || dateValues.some((d) => Number.isNaN(d.getTime()))) return '#VALUE!';
  let rate = normalizeRate(guess);
  const first = dateValues[0];
  for (let i = 0; i < 80; i += 1) {
    let value = 0;
    let derivative = 0;
    cashflows.forEach((cashflow, index) => {
      const years = (dateValues[index] - first) / 365 / 86400000;
      value += cashflow / ((1 + rate) ** years);
      derivative -= years * cashflow / ((1 + rate) ** (years + 1));
    });
    const next = rate - value / derivative;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
  }
  return rate;
}

function sumProduct(...arrays) {
  const normalized = arrays.map((array) => flattenValues([array]).map(toNumber));
  const length = Math.min(...normalized.map((array) => array.length));
  if (!Number.isFinite(length) || length <= 0) return 0;
  let total = 0;
  for (let i = 0; i < length; i += 1) total += normalized.reduce((product, array) => product * array[i], 1);
  return total;
}

function averageWeighted(values, weights) {
  const nums = flattenValues([values]).map(toNumber);
  const w = flattenValues([weights]).map(toNumber);
  const length = Math.min(nums.length, w.length);
  const totalWeight = w.slice(0, length).reduce((sum, value) => sum + value, 0);
  if (!totalWeight) return '#DIV/0!';
  return nums.slice(0, length).reduce((sum, value, index) => sum + value * w[index], 0) / totalWeight;
}

function subtotalByCode(code, ...values) {
  const fn = Math.trunc(toNumber(code));
  const normalized = fn > 100 ? fn - 100 : fn;
  if (normalized === 1) return SAFE_FORMULA_FUNCTIONS.AVERAGE(...values);
  if (normalized === 2) return SAFE_FORMULA_FUNCTIONS.COUNT(...values);
  if (normalized === 3) return SAFE_FORMULA_FUNCTIONS.COUNTA(...values);
  if (normalized === 4) return SAFE_FORMULA_FUNCTIONS.MAX(...values);
  if (normalized === 5) return SAFE_FORMULA_FUNCTIONS.MIN(...values);
  if (normalized === 6) return SAFE_FORMULA_FUNCTIONS.PRODUCT(...values);
  if (normalized === 7) return SAFE_FORMULA_FUNCTIONS.STDEV(...values);
  if (normalized === 8) return SAFE_FORMULA_FUNCTIONS.STDEV(...values);
  if (normalized === 9) return SAFE_FORMULA_FUNCTIONS.SUM(...values);
  if (normalized === 10) return SAFE_FORMULA_FUNCTIONS.VAR(...values);
  if (normalized === 11) return SAFE_FORMULA_FUNCTIONS.VAR(...values);
  return '#VALUE!';
}

function frequency(dataArray, binsArray) {
  const data = numberValues([dataArray]);
  const bins = numberValues([binsArray]).sort((a, b) => a - b);
  const counts = Array.from({ length: bins.length + 1 }, () => 0);
  data.forEach((value) => {
    const index = bins.findIndex((bin) => value <= bin);
    counts[index >= 0 ? index : bins.length] += 1;
  });
  return counts.join(', ');
}

function percentRank(values, x) {
  const nums = numberValues([values]).sort((a, b) => a - b);
  if (!nums.length) return '#N/A';
  const target = toNumber(x);
  const index = nums.findIndex((value) => value >= target);
  if (index < 0) return 1;
  if (nums[index] === target) return nums.length === 1 ? 0 : index / (nums.length - 1);
  if (index === 0) return 0;
  const lower = nums[index - 1];
  const upper = nums[index];
  return ((index - 1) + ((target - lower) / (upper - lower))) / (nums.length - 1);
}

function covariance(array1, array2) {
  const a = numberValues([array1]);
  const b = numberValues([array2]);
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  const avgA = a.slice(0, length).reduce((sum, value) => sum + value, 0) / length;
  const avgB = b.slice(0, length).reduce((sum, value) => sum + value, 0) / length;
  return a.slice(0, length).reduce((sum, value, index) => sum + ((value - avgA) * (b[index] - avgB)), 0) / length;
}

function correl(array1, array2) {
  const cov = covariance(array1, array2);
  const stdevA = SAFE_FORMULA_FUNCTIONS.STDEV(array1);
  const stdevB = SAFE_FORMULA_FUNCTIONS.STDEV(array2);
  return safeDivide(cov, stdevA * stdevB, '#DIV/0!');
}

function bondPeriods(settlement, maturity, frequency = 1) {
  const days = Math.max(0, dateDiffDays(settlement, maturity));
  if (!Number.isFinite(days)) return NaN;
  return Math.max(1, Math.ceil(days / (365 / toNumber(frequency || 1))));
}

function agingBucket(dueDate, asOf = new Date()) {
  const days = Math.max(0, Math.floor(dateDiffDays(dueDate, asOf)));
  if (!Number.isFinite(days)) return '#VALUE!';
  if (days <= 0) return 'Vigente';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}


function toExcelLogicalNumber(value) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (isNumericValue(value)) return toNumber(value);
  if (value === null || value === undefined || value === '') return 0;
  return 0;
}

function logicalNumberValues(values = []) {
  return flattenValues(values).map(toExcelLogicalNumber);
}

function aggregateByCode(code, ...values) {
  const fn = Math.trunc(toNumber(code));
  const normalized = fn > 100 ? fn - 100 : fn;
  return subtotalByCode(normalized, ...values);
}

function excelSerialDate(dateValue) {
  const date = makeDate(dateValue);
  if (Number.isNaN(date.getTime())) return '#VALUE!';
  return Math.round(date.getTime() / 86400000 + 25569);
}

function formatTextValue(value, format = '') {
  const fmt = String(format || '').toLowerCase();
  if (value instanceof Date || /[dmy]/i.test(fmt)) {
    const date = makeDate(value);
    if (Number.isNaN(date.getTime())) return String(value ?? '');
    return date.toLocaleDateString('es-MX');
  }
  const number = toNumber(value);
  if (fmt.includes('%')) return `${(number * 100).toFixed((fmt.match(/0/g) || []).length > 1 ? 2 : 0)}%`;
  const decimals = (fmt.split('.')[1] || '').replace(/[^0]/g, '').length;
  if (fmt.includes('$')) return number.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: decimals || 2, maximumFractionDigits: decimals || 2 });
  if (fmt.includes(',')) return number.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return decimals ? number.toFixed(decimals) : String(value ?? '');
}

function numberValue(text, decimalSeparator = '.', groupSeparator = ',') {
  const raw = String(text ?? '').trim();
  const clean = raw.split(String(groupSeparator)).join('').replace(String(decimalSeparator), '.');
  const value = Number(clean);
  return Number.isFinite(value) ? value : '#VALUE!';
}

function weekendDaysFromCode(code = 1) {
  const map = {
    1: [0, 6], 2: [0, 1], 3: [1, 2], 4: [2, 3], 5: [3, 4], 6: [4, 5], 7: [5, 6],
    11: [0], 12: [1], 13: [2], 14: [3], 15: [4], 16: [5], 17: [6],
  };
  if (typeof code === 'string' && /^[01]{7}$/.test(code)) {
    return [...code].map((char, index) => char === '1' ? index + 1 : null).filter((day) => day !== null).map((day) => day % 7);
  }
  return map[Math.trunc(toNumber(code))] || map[1];
}

function isBusinessDayIntl(date, weekend = 1, holidays = []) {
  const day = makeDate(date).getDay();
  return !weekendDaysFromCode(weekend).includes(day) && !isHoliday(date, holidays);
}

function networkDaysIntl(startDate, endDate, weekend = 1, holidays = []) {
  const start = makeDate(startDate);
  const end = makeDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '#VALUE!';
  const step = start <= end ? 1 : -1;
  let count = 0;
  const current = new Date(start);
  while ((step > 0 && current <= end) || (step < 0 && current >= end)) {
    if (isBusinessDayIntl(current, weekend, holidays)) count += step;
    current.setDate(current.getDate() + step);
  }
  return count;
}

function workDayIntl(startDate, days = 0, weekend = 1, holidays = []) {
  const current = makeDate(startDate);
  if (Number.isNaN(current.getTime())) return '#VALUE!';
  const step = toNumber(days) >= 0 ? 1 : -1;
  let remaining = Math.abs(Math.trunc(toNumber(days)));
  while (remaining > 0) {
    current.setDate(current.getDate() + step);
    if (isBusinessDayIntl(current, weekend, holidays)) remaining -= 1;
  }
  return current;
}

function couponDays(settlement, maturity, frequency = 1) {
  return Math.round(365 / Math.max(1, toNumber(frequency)));
}

function couponNumber(settlement, maturity, frequency = 1) {
  const days = Math.max(0, dateDiffDays(settlement, maturity));
  return Math.ceil(days / couponDays(settlement, maturity, frequency));
}

function cashflowPayback(initialInvestment, cashflows) {
  const target = Math.abs(toNumber(initialInvestment));
  const flows = flattenValues([cashflows]).map(toNumber);
  let accumulated = 0;
  for (let index = 0; index < flows.length; index += 1) {
    const before = accumulated;
    accumulated += flows[index];
    if (accumulated >= target) {
      const remainder = target - before;
      return index + safeDivide(remainder, flows[index], 0);
    }
  }
  return '#N/A';
}

function arrayToDisplay(value) {
  const rows = matrixRows(value);
  return rows.map((row) => row.join(' | ')).join('\n');
}

function filterArray(array, include, ifEmpty = '') {
  const rows = matrixRows(array);
  const flags = flattenValues([include]);
  const result = rows.filter((_, index) => Boolean(flags[index]) && String(flags[index]).toUpperCase() !== 'FALSE');
  return result.length ? arrayToDisplay(result) : ifEmpty;
}

function uniqueArray(array) {
  const seen = new Set();
  const out = [];
  flattenValues([array]).forEach((value) => {
    const key = String(value);
    if (!seen.has(key)) { seen.add(key); out.push(value); }
  });
  return out.join(', ');
}

function sortArray(array, sortIndex = 1, sortOrder = 1) {
  const col = Math.max(0, Math.trunc(toNumber(sortIndex)) - 1);
  const direction = toNumber(sortOrder) < 0 ? -1 : 1;
  const rows = matrixRows(array).slice().sort((a, b) => String(a[col] ?? '').localeCompare(String(b[col] ?? ''), 'es', { numeric: true }) * direction);
  return arrayToDisplay(rows);
}

function takeArray(array, rowCount, colCount = null) {
  const rows = matrixRows(array);
  const r = Math.trunc(toNumber(rowCount));
  const selectedRows = r < 0 ? rows.slice(r) : rows.slice(0, r);
  const c = colCount === null ? null : Math.trunc(toNumber(colCount));
  const selected = c === null ? selectedRows : selectedRows.map((row) => c < 0 ? row.slice(c) : row.slice(0, c));
  return arrayToDisplay(selected);
}

function dropArray(array, rowCount, colCount = 0) {
  const rows = matrixRows(array);
  const r = Math.trunc(toNumber(rowCount));
  const afterRows = r < 0 ? rows.slice(0, rows.length + r) : rows.slice(r);
  const c = Math.trunc(toNumber(colCount));
  const selected = !c ? afterRows : afterRows.map((row) => c < 0 ? row.slice(0, row.length + c) : row.slice(c));
  return arrayToDisplay(selected);
}


function variance(values, sample = true) {
  const nums = numberValues([values]);
  const divisor = nums.length - (sample ? 1 : 0);
  if (divisor <= 0) return 0;
  const avg = nums.reduce((sum, value) => sum + value, 0) / nums.length;
  return nums.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / divisor;
}

function stdev(values, sample = true) {
  return Math.sqrt(variance(values, sample));
}

function percentileExclusive(values, k = 0) {
  const nums = numberValues([values]).sort((a, b) => a - b);
  if (!nums.length) return '#N/A';
  const ratio = toNumber(k);
  if (ratio <= 0 || ratio >= 1) return '#NUM!';
  const index = ratio * (nums.length + 1) - 1;
  if (index < 0 || index > nums.length - 1) return '#NUM!';
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return nums[lower];
  return nums[lower] + (nums[upper] - nums[lower]) * (index - lower);
}

function percentRankDetailed(values, x, significance = 3, exclusive = false) {
  const nums = numberValues([values]).sort((a, b) => a - b);
  if (!nums.length) return '#N/A';
  const target = toNumber(x);
  const n = nums.length;
  if (target < nums[0] || target > nums[n - 1]) return '#N/A';
  let rank = 0;
  for (let i = 0; i < n; i += 1) {
    if (nums[i] === target) {
      rank = exclusive ? (i + 1) / (n + 1) : i / (n - 1 || 1);
      break;
    }
    if (nums[i] > target) {
      const low = nums[i - 1];
      const high = nums[i];
      const fraction = (target - low) / (high - low || 1);
      rank = exclusive ? (i + fraction) / (n + 1) : (i - 1 + fraction) / (n - 1 || 1);
      break;
    }
  }
  const digits = Math.max(1, Math.trunc(toNumber(significance || 3)));
  return Number(rank.toFixed(digits));
}

function erfApprox(x) {
  const sign = x < 0 ? -1 : 1;
  const abs = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * abs);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-abs * abs);
  return sign * y;
}

function normalPdf(x, mean = 0, sd = 1) {
  const sigma = toNumber(sd);
  if (sigma <= 0) return '#NUM!';
  const z = (toNumber(x) - toNumber(mean)) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function normalCdf(x, mean = 0, sd = 1) {
  const sigma = toNumber(sd);
  if (sigma <= 0) return '#NUM!';
  const z = (toNumber(x) - toNumber(mean)) / (sigma * Math.sqrt(2));
  return 0.5 * (1 + erfApprox(z));
}

function inverseNormal(p, mean = 0, sd = 1) {
  const probability = toNumber(p);
  const sigma = toNumber(sd);
  if (probability <= 0 || probability >= 1 || sigma <= 0) return '#NUM!';
  // Aproximación de Peter John Acklam, suficientemente práctica para análisis interno.
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q;
  let x;
  if (probability < plow) {
    q = Math.sqrt(-2 * Math.log(probability));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (probability <= phigh) {
    q = probability - 0.5;
    const r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - probability));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  return toNumber(mean) + sigma * x;
}

function pairedNumbers(yValues, xValues) {
  const ys = flattenValues([yValues]).map(toNumber);
  const xs = flattenValues([xValues]).map(toNumber);
  const length = Math.min(ys.length, xs.length);
  return { ys: ys.slice(0, length), xs: xs.slice(0, length) };
}

function slopeValue(yValues, xValues) {
  const { ys, xs } = pairedNumbers(yValues, xValues);
  if (ys.length < 2) return '#DIV/0!';
  const avgY = ys.reduce((s, v) => s + v, 0) / ys.length;
  const avgX = xs.reduce((s, v) => s + v, 0) / xs.length;
  const numerator = ys.reduce((s, y, i) => s + ((xs[i] - avgX) * (y - avgY)), 0);
  const denominator = xs.reduce((s, x) => s + ((x - avgX) ** 2), 0);
  return safeDivide(numerator, denominator);
}

function interceptValue(yValues, xValues) {
  const { ys, xs } = pairedNumbers(yValues, xValues);
  if (!ys.length) return '#DIV/0!';
  const avgY = ys.reduce((s, v) => s + v, 0) / ys.length;
  const avgX = xs.reduce((s, v) => s + v, 0) / xs.length;
  return avgY - toNumber(slopeValue(ys, xs)) * avgX;
}

function correlationValue(yValues, xValues) {
  const { ys, xs } = pairedNumbers(yValues, xValues);
  if (ys.length < 2) return '#DIV/0!';
  const avgY = ys.reduce((s, v) => s + v, 0) / ys.length;
  const avgX = xs.reduce((s, v) => s + v, 0) / xs.length;
  const numerator = ys.reduce((s, y, i) => s + ((xs[i] - avgX) * (y - avgY)), 0);
  const denX = Math.sqrt(xs.reduce((s, x) => s + ((x - avgX) ** 2), 0));
  const denY = Math.sqrt(ys.reduce((s, y) => s + ((y - avgY) ** 2), 0));
  return safeDivide(numerator, denX * denY);
}

function arrayToMatrix(value) {
  return matrixRows(value);
}

function textBefore(value, delimiter) {
  const text = String(value ?? '');
  const index = text.indexOf(String(delimiter ?? ''));
  return index >= 0 ? text.slice(0, index) : '#N/A';
}

function textAfter(value, delimiter) {
  const text = String(value ?? '');
  const sep = String(delimiter ?? '');
  const index = text.indexOf(sep);
  return index >= 0 ? text.slice(index + sep.length) : '#N/A';
}

function textSplit(value, delimiter) {
  return String(value ?? '').split(String(delimiter ?? ',')).join('\t');
}

function chooseCols(array, ...cols) {
  const rows = arrayToMatrix(array);
  const indexes = cols.map((col) => Math.trunc(toNumber(col)) - 1);
  return arrayToDisplay(rows.map((row) => indexes.map((index) => row[index] ?? '')));
}

function chooseRows(array, ...rowsArg) {
  const rows = arrayToMatrix(array);
  const selected = rowsArg.map((rowNum) => rows[Math.trunc(toNumber(rowNum)) - 1] || []);
  return arrayToDisplay(selected);
}

function transposeArray(array) {
  const rows = arrayToMatrix(array);
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const result = Array.from({ length: maxCols }, (_, col) => rows.map((row) => row[col] ?? ''));
  return arrayToDisplay(result);
}

function hStack(...arrays) {
  const matrices = arrays.map(arrayToMatrix);
  const maxRows = matrices.reduce((max, rows) => Math.max(max, rows.length), 0);
  const result = Array.from({ length: maxRows }, (_, rowIndex) => matrices.flatMap((rows) => rows[rowIndex] || Array.from({ length: rows[0]?.length || 1 }, () => '')));
  return arrayToDisplay(result);
}

function vStack(...arrays) {
  return arrayToDisplay(arrays.flatMap((array) => arrayToMatrix(array)));
}

function xmatch(lookupValue, lookupArray, matchMode = 0, searchMode = 1) {
  const values = flattenValues([lookupArray]);
  const target = lookupValue;
  const reverse = toNumber(searchMode) === -1;
  const source = reverse ? values.map((v, i) => [v, i]).reverse() : values.map((v, i) => [v, i]);
  const exact = source.find(([value]) => String(value) === String(target));
  if (exact) return exact[1] + 1;
  if (toNumber(matchMode) === 1) {
    let best = null;
    values.forEach((value, index) => { if (toNumber(value) >= toNumber(target) && (best === null || toNumber(value) < toNumber(values[best]))) best = index; });
    return best === null ? '#N/A' : best + 1;
  }
  if (toNumber(matchMode) === -1) {
    let best = null;
    values.forEach((value, index) => { if (toNumber(value) <= toNumber(target) && (best === null || toNumber(value) > toNumber(values[best]))) best = index; });
    return best === null ? '#N/A' : best + 1;
  }
  return '#N/A';
}

function trimMean(values, percent = 0) {
  const nums = numberValues([values]).sort((a, b) => a - b);
  if (!nums.length) return '#DIV/0!';
  const remove = Math.floor(nums.length * toNumber(percent) / 2);
  const trimmed = nums.slice(remove, nums.length - remove);
  return trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
}

function isoWeekNumber(dateValue) {
  const date = makeDate(dateValue);
  if (Number.isNaN(date.getTime())) return '#VALUE!';
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}


function factorialNumber(value) {
  const n = Math.floor(Math.max(0, toNumber(value)));
  if (n > 170) return '#NUM!';
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

function doubleFactorialNumber(value) {
  const n = Math.floor(Math.max(0, toNumber(value)));
  if (n > 300) return '#NUM!';
  let result = 1;
  for (let i = n; i > 1; i -= 2) result *= i;
  return result;
}

function combinNumber(nValue, kValue, repeat = false) {
  const n = Math.floor(toNumber(nValue));
  const k = Math.floor(toNumber(kValue));
  if (n < 0 || k < 0) return '#NUM!';
  const nn = repeat ? n + k - 1 : n;
  if (k > nn) return 0;
  return factorialNumber(nn) / (factorialNumber(k) * factorialNumber(nn - k));
}

function permutNumber(nValue, kValue, repeat = false) {
  const n = Math.floor(toNumber(nValue));
  const k = Math.floor(toNumber(kValue));
  if (n < 0 || k < 0) return '#NUM!';
  if (repeat) return n ** k;
  if (k > n) return 0;
  return factorialNumber(n) / factorialNumber(n - k);
}

function romanNumber(value) {
  let n = Math.floor(toNumber(value));
  if (n <= 0 || n > 3999) return '#VALUE!';
  const parts = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
  let out = '';
  for (const [sym, val] of parts) {
    while (n >= val) { out += sym; n -= val; }
  }
  return out;
}

function arabicNumber(value) {
  const text = String(value || '').toUpperCase().trim();
  const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let total = 0;
  for (let i = 0; i < text.length; i += 1) {
    const current = map[text[i]] || 0;
    const next = map[text[i + 1]] || 0;
    total += current < next ? -current : current;
  }
  return total || '#VALUE!';
}

function sequenceArray(rows = 1, columns = 1, start = 1, step = 1) {
  const rowCount = Math.max(1, Math.trunc(toNumber(rows)));
  const colCount = Math.max(1, Math.trunc(toNumber(columns)));
  const out = [];
  let current = toNumber(start);
  for (let r = 0; r < rowCount; r += 1) {
    const row = [];
    for (let c = 0; c < colCount; c += 1) {
      row.push(current);
      current += toNumber(step);
    }
    out.push(row);
  }
  return arrayToDisplay(out);
}

function wrapVector(values, count = 1, byRows = true) {
  const flat = flattenValues([values]);
  const size = Math.max(1, Math.trunc(toNumber(count)));
  const out = [];
  if (byRows) {
    for (let i = 0; i < flat.length; i += size) out.push(flat.slice(i, i + size));
  } else {
    const rows = Math.ceil(flat.length / size);
    for (let r = 0; r < rows; r += 1) {
      const row = [];
      for (let c = 0; c < size; c += 1) row.push(flat[c * rows + r] ?? '');
      out.push(row);
    }
  }
  return arrayToDisplay(out);
}

function runningTotal(values) {
  let total = 0;
  return arrayToDisplay([flattenValues([values]).map((value) => {
    total += toNumber(value);
    return total;
  })]);
}

function isDateLike(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  if (typeof value === 'number') return value > 0;
  const date = makeDate(value);
  return !Number.isNaN(date.getTime());
}

const SAFE_FORMULA_FUNCTIONS = {
  SUM: (...values) => numberValues(values).reduce((sum, value) => sum + value, 0),
  AVG: (...values) => { const nums = numberValues(values); return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0; },
  AVERAGE: (...values) => { const nums = numberValues(values); return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0; },
  MIN: (...values) => { const nums = numberValues(values); return nums.length ? Math.min(...nums) : 0; },
  MAX: (...values) => { const nums = numberValues(values); return nums.length ? Math.max(...nums) : 0; },
  COUNT: (...values) => numberValues(values).length,
  COUNTA: (...values) => flattenValues(values).filter((value) => value !== null && value !== undefined && value !== '').length,
  PRODUCT: (...values) => { const nums = numberValues(values); return nums.length ? nums.reduce((total, value) => total * value, 1) : 0; },
  GCD: (...values) => numberValues(values).reduce((acc, value) => gcdPair(acc, value), 0),
  LCM: (...values) => numberValues(values).reduce((acc, value) => acc ? lcmPair(acc, value) : value, 0),
  MEDIAN: (...values) => { const nums = numberValues(values).sort((a, b) => a - b); const mid = Math.floor(nums.length / 2); return nums.length ? (nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2) : 0; },
  MODE: (...values) => { const nums = numberValues(values); if (!nums.length) return '#N/A'; const counts = new Map(); nums.forEach((n) => counts.set(n, (counts.get(n) || 0) + 1)); return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]; },
  STDEV: (...values) => { const nums = numberValues(values); if (nums.length < 2) return 0; const avg = nums.reduce((a, b) => a + b, 0) / nums.length; return Math.sqrt(nums.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (nums.length - 1)); },
  VAR: (...values) => { const nums = numberValues(values); if (nums.length < 2) return 0; const avg = nums.reduce((a, b) => a + b, 0) / nums.length; return nums.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (nums.length - 1); },
  LARGE: (values, k = 1) => numberValues([values]).sort((a, b) => b - a)[Math.max(0, Number(k) - 1)] ?? '#N/A',
  SMALL: (values, k = 1) => numberValues([values]).sort((a, b) => a - b)[Math.max(0, Number(k) - 1)] ?? '#N/A',
  RANK: (number, ref, order = 0) => { const nums = numberValues([ref]).sort((a, b) => Number(order) ? a - b : b - a); const index = nums.findIndex((value) => value === toNumber(number)); return index >= 0 ? index + 1 : '#N/A'; },
  PERCENTILE: (values, k = 0) => percentile(values, k),
  QUARTILE: (values, quart = 1) => percentile(values, Number(quart || 0) / 4),
  SUMIF: (range, criterion, sumRange = range) => flattenValues([range]).reduce((sum, value, index) => compareCriterion(value, criterion) ? sum + toNumber(flattenValues([sumRange])[index]) : sum, 0),
  COUNTIF: (range, criterion) => flattenValues([range]).filter((value) => compareCriterion(value, criterion)).length,
  AVERAGEIF: (range, criterion, avgRange = range) => { const values = flattenValues([range]); const targets = flattenValues([avgRange]); const nums = values.map((value, index) => compareCriterion(value, criterion) ? targets[index] : null).filter(isNumericValue).map(toNumber); return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; },
  SUMIFS: (sumRange, ...criteria) => criteriaFilter(sumRange, Array.from({ length: Math.floor(criteria.length / 2) }, (_, i) => [criteria[i * 2], criteria[i * 2 + 1]])).reduce((sum, value) => sum + toNumber(value), 0),
  COUNTIFS: (...criteria) => { const pairs = Array.from({ length: Math.floor(criteria.length / 2) }, (_, i) => [criteria[i * 2], criteria[i * 2 + 1]]); const first = flattenValues([pairs[0]?.[0] || []]); return first.filter((_, index) => pairs.every(([range, criterion]) => compareCriterion(flattenValues([range])[index], criterion))).length; },
  AVERAGEIFS: (avgRange, ...criteria) => { const values = criteriaFilter(avgRange, Array.from({ length: Math.floor(criteria.length / 2) }, (_, i) => [criteria[i * 2], criteria[i * 2 + 1]])).filter(isNumericValue).map(toNumber); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; },
  MAXIFS: (maxRange, ...criteria) => { const values = criteriaFilter(maxRange, Array.from({ length: Math.floor(criteria.length / 2) }, (_, i) => [criteria[i * 2], criteria[i * 2 + 1]])).filter(isNumericValue).map(toNumber); return values.length ? Math.max(...values) : 0; },
  MINIFS: (minRange, ...criteria) => { const values = criteriaFilter(minRange, Array.from({ length: Math.floor(criteria.length / 2) }, (_, i) => [criteria[i * 2], criteria[i * 2 + 1]])).filter(isNumericValue).map(toNumber); return values.length ? Math.min(...values) : 0; },
  TRUE: true,
  FALSE: false,
  IF: (condition, whenTrue, whenFalse = '') => (condition ? whenTrue : whenFalse),
  IFS: (...args) => { for (let i = 0; i < args.length; i += 2) if (args[i]) return args[i + 1] ?? ''; return '#N/A'; },
  IFERROR: (value, fallback = '') => String(value).startsWith('#') ? fallback : value,
  ROUND: (value, digits = 0) => Number(toNumber(value).toFixed(Math.max(0, Number(digits || 0)))),
  ROUNDUP: (value, digits = 0) => { const factor = 10 ** Number(digits || 0); return Math.ceil(toNumber(value) * factor) / factor; },
  ROUNDDOWN: (value, digits = 0) => { const factor = 10 ** Number(digits || 0); return Math.floor(toNumber(value) * factor) / factor; },
  ABS: (value) => Math.abs(toNumber(value)),
  SQRT: (value) => Math.sqrt(toNumber(value)),
  POWER: (base, exponent) => Math.pow(toNumber(base), toNumber(exponent)),
  MOD: (value, divisor) => toNumber(value) % toNumber(divisor),
  INT: (value) => Math.floor(toNumber(value)),
  TRUNC: (value, digits = 0) => { const factor = 10 ** Number(digits || 0); return Math.trunc(toNumber(value) * factor) / factor; },
  MROUND: (value, multiple = 1) => Math.round(toNumber(value) / toNumber(multiple || 1)) * toNumber(multiple || 1),
  EVEN: (value) => { const n = Math.ceil(Math.abs(toNumber(value))); const even = n % 2 === 0 ? n : n + 1; return toNumber(value) < 0 ? -even : even; },
  ODD: (value) => { const n = Math.ceil(Math.abs(toNumber(value))); const odd = n % 2 === 1 ? n : n + 1; return toNumber(value) < 0 ? -odd : odd; },
  SIGN: (value) => Math.sign(toNumber(value)),
  CEILING: (value, significance = 1) => Math.ceil(toNumber(value) / toNumber(significance || 1)) * toNumber(significance || 1),
  FLOOR: (value, significance = 1) => Math.floor(toNumber(value) / toNumber(significance || 1)) * toNumber(significance || 1),
  RAND: () => Math.random(),
  RANDBETWEEN: (min, max) => Math.floor(Math.random() * (toNumber(max) - toNumber(min) + 1)) + toNumber(min),
  PI: () => Math.PI,
  SIN: (value) => Math.sin(toNumber(value)), COS: (value) => Math.cos(toNumber(value)), TAN: (value) => Math.tan(toNumber(value)),
  ASIN: (value) => Math.asin(toNumber(value)), ACOS: (value) => Math.acos(toNumber(value)), ATAN: (value) => Math.atan(toNumber(value)),
  LOG: (value, base = 10) => Math.log(toNumber(value)) / Math.log(toNumber(base)), LN: (value) => Math.log(toNumber(value)), EXP: (value) => Math.exp(toNumber(value)),
  DEGREES: (value) => toNumber(value) * 180 / Math.PI, RADIANS: (value) => toNumber(value) * Math.PI / 180,
  TODAY: () => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  NOW: () => new Date(),
  DATE: (year, month, day) => new Date(Number(year), Number(month) - 1, Number(day)),
  DAY: (value) => makeDate(value).getDate(), MONTH: (value) => makeDate(value).getMonth() + 1, YEAR: (value) => makeDate(value).getFullYear(),
  DAYS: (endDate, startDate) => Math.round((makeDate(endDate) - makeDate(startDate)) / 86400000),
  EDATE: (startDate, months = 0) => addMonths(startDate, months), EOMONTH: (startDate, months = 0) => addMonths(startDate, months, true),
  WEEKDAY: (value, type = 1) => { const day = makeDate(value).getDay(); return Number(type) === 2 ? (day || 7) : day + 1; }, WEEKNUM: (value) => weekNumber(value),
  HOUR: (value) => makeDate(value).getHours(), MINUTE: (value) => makeDate(value).getMinutes(), SECOND: (value) => makeDate(value).getSeconds(),
  LEN: (value) => String(value ?? '').length,
  CONCAT: (...values) => flattenValues(values).map((value) => String(value ?? '')).join(''),
  TEXTJOIN: (delimiter = '', ignoreEmpty = true, ...values) => flattenValues(values).filter((value) => !ignoreEmpty || value !== '').map((value) => String(value ?? '')).join(String(delimiter)),
  LEFT: (value, count = 1) => String(value ?? '').slice(0, Math.max(0, Number(count || 0))),
  RIGHT: (value, count = 1) => String(value ?? '').slice(-Math.max(0, Number(count || 0))),
  MID: (value, start = 1, count = 1) => String(value ?? '').slice(Math.max(0, Number(start) - 1), Math.max(0, Number(start) - 1) + Math.max(0, Number(count))),
  UPPER: (value) => String(value ?? '').toUpperCase(),
  LOWER: (value) => String(value ?? '').toLowerCase(),
  PROPER: (value) => String(value ?? '').toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()),
  TRIM: (value) => String(value ?? '').trim().replace(/\s+/g, ' '),
  CLEAN: (value) => String(value ?? '').replace(/[\x00-\x1F\x7F]/g, ''),
  REPT: (value, count = 1) => String(value ?? '').repeat(Math.max(0, Number(count || 0))),
  FIND: (needle, haystack, start = 1) => { const index = String(haystack ?? '').indexOf(String(needle ?? ''), Math.max(0, Number(start) - 1)); return index >= 0 ? index + 1 : '#VALUE!'; },
  SEARCH: (needle, haystack, start = 1) => { const index = String(haystack ?? '').toLowerCase().indexOf(String(needle ?? '').toLowerCase(), Math.max(0, Number(start) - 1)); return index >= 0 ? index + 1 : '#VALUE!'; },
  SUBSTITUTE: (text, oldText, newText, instance) => { const source = String(text ?? ''); const oldValue = String(oldText ?? ''); if (!instance) return source.split(oldValue).join(String(newText ?? '')); let count = 0; return source.replaceAll(oldValue, (match) => { count += 1; return count === Number(instance) ? String(newText ?? '') : match; }); },
  REPLACE: (text, start, count, newText) => { const source = String(text ?? ''); const from = Math.max(0, Number(start) - 1); return source.slice(0, from) + String(newText ?? '') + source.slice(from + Number(count || 0)); },
  VALUE: (value) => toNumber(value),
  EXACT: (a, b) => String(a ?? '') === String(b ?? ''),
  AND: (...values) => flattenValues(values).every(Boolean),
  OR: (...values) => flattenValues(values).some(Boolean),
  XOR: (...values) => flattenValues(values).filter(Boolean).length % 2 === 1,
  NOT: (value) => !value,
  ISBLANK: (value) => value === '' || value === null || value === undefined,
  ISNUMBER: (value) => isNumericValue(value),
  ISTEXT: (value) => !isNumericValue(value) && value !== null && value !== undefined,
  ISERROR: (value) => String(value ?? '').startsWith('#'),
  ISNA: (value) => String(value ?? '') === '#N/A',
  INDEX: (range, row = 1, col = 1) => atMatrix(range, Math.max(0, Number(row) - 1), Math.max(0, Number(col) - 1)),
  MATCH: (lookup, range, matchType = 0) => { const values = flattenValues([range]); const index = values.findIndex((value) => String(value).toLowerCase() === String(lookup).toLowerCase()); return index >= 0 ? index + 1 : '#N/A'; },
  VLOOKUP: (lookup, table, colIndex = 1, approximate = false) => { const rows = matrixRows(table); const found = rows.find((row) => String(row[0]).toLowerCase() === String(lookup).toLowerCase()) || (approximate ? rows.filter((row) => toNumber(row[0]) <= toNumber(lookup)).at(-1) : null); return found ? found[Math.max(0, Number(colIndex) - 1)] ?? '#N/A' : '#N/A'; },
  HLOOKUP: (lookup, table, rowIndex = 1, approximate = false) => { const rows = matrixRows(table); const first = rows[0] || []; const col = first.findIndex((value) => String(value).toLowerCase() === String(lookup).toLowerCase()); if (col >= 0) return rows[Math.max(0, Number(rowIndex) - 1)]?.[col] ?? '#N/A'; if (!approximate) return '#N/A'; const fallbackCol = first.map((value, index) => ({ value, index })).filter((item) => toNumber(item.value) <= toNumber(lookup)).at(-1)?.index; return fallbackCol === undefined ? '#N/A' : rows[Math.max(0, Number(rowIndex) - 1)]?.[fallbackCol] ?? '#N/A'; },
  XLOOKUP: (lookup, lookupArray, returnArray, ifNotFound = '#N/A') => { const lookupValues = flattenValues([lookupArray]); const returnValues = flattenValues([returnArray]); const index = lookupValues.findIndex((value) => String(value).toLowerCase() === String(lookup).toLowerCase()); return index >= 0 ? returnValues[index] ?? '' : ifNotFound; },
  CHOOSE: (index, ...values) => values[Math.max(0, Number(index) - 1)] ?? '#VALUE!',
  SWITCH: (expression, ...pairs) => { for (let i = 0; i < pairs.length - 1; i += 2) if (String(expression) === String(pairs[i])) return pairs[i + 1]; return pairs.length % 2 ? pairs[pairs.length - 1] : '#N/A'; },
  PMT: (rate, nper, pv, fv = 0, type = 0) => financePmt(rate, nper, pv, fv, type),
  PV: (rate, nper, pmt = 0, fv = 0, type = 0) => financePv(rate, nper, pmt, fv, type),
  FV: (rate, nper, pmt = 0, pv = 0, type = 0) => financeFv(rate, nper, pmt, pv, type),
  NPER: (rate, pmt, pv, fv = 0, type = 0) => financeNper(rate, pmt, pv, fv, type),
  RATE: (nper, pmt, pv, fv = 0, type = 0, guess = 0.1) => financeRate(nper, pmt, pv, fv, type, guess),
  IPMT: (rate, per, nper, pv, fv = 0, type = 0) => { const balance = financePv(rate, Number(nper) - Number(per) + 1, financePmt(rate, nper, pv, fv, type), fv, type); return balance * normalizeRate(rate); },
  PPMT: (rate, per, nper, pv, fv = 0, type = 0) => financePmt(rate, nper, pv, fv, type) - SAFE_FORMULA_FUNCTIONS.IPMT(rate, per, nper, pv, fv, type),
  CUMIPMT: (rate, nper, pv, startPeriod, endPeriod, type = 0) => { let total = 0; for (let period = Number(startPeriod); period <= Number(endPeriod); period += 1) total += SAFE_FORMULA_FUNCTIONS.IPMT(rate, period, nper, pv, 0, type); return total; },
  CUMPRINC: (rate, nper, pv, startPeriod, endPeriod, type = 0) => { let total = 0; for (let period = Number(startPeriod); period <= Number(endPeriod); period += 1) total += SAFE_FORMULA_FUNCTIONS.PPMT(rate, period, nper, pv, 0, type); return total; },
  NPV: (rate, ...values) => npv(rate, values),
  IRR: (values, guess = 0.1) => irr(values, guess),
  MIRR: (values, financeRateValue = 0.1, reinvestRate = 0.1) => { const cashflows = flattenValues([values]).map(toNumber); const negatives = cashflows.map((v) => Math.min(0, v)); const positives = cashflows.map((v) => Math.max(0, v)); const n = cashflows.length - 1; const pvNeg = npv(financeRateValue, negatives); const fvPos = positives.reduce((sum, value, index) => sum + value * ((1 + normalizeRate(reinvestRate)) ** (n - index)), 0); return ((-fvPos / pvNeg) ** (1 / n)) - 1; },
  SLN: (cost, salvage, life) => safeDivide(toNumber(cost) - toNumber(salvage), life),
  SYD: (cost, salvage, life, period) => ((toNumber(cost) - toNumber(salvage)) * (toNumber(life) - toNumber(period) + 1) * 2) / (toNumber(life) * (toNumber(life) + 1)),
  DDB: (cost, salvage, life, period, factor = 2) => ddb(cost, salvage, life, period, factor),
  DB: (cost, salvage, life, period) => ddb(cost, salvage, life, period, 1),
  EFFECT: (nominalRate, npery) => ((1 + normalizeRate(nominalRate) / toNumber(npery)) ** toNumber(npery)) - 1,
  NOMINAL: (effectRate, npery) => toNumber(npery) * (((1 + normalizeRate(effectRate)) ** (1 / toNumber(npery))) - 1),
  RRI: (nper, pv, fv) => ((toNumber(fv) / toNumber(pv)) ** (1 / toNumber(nper))) - 1,
  PDURATION: (rate, pv, fv) => Math.log(toNumber(fv) / toNumber(pv)) / Math.log(1 + normalizeRate(rate)),
  FVSCHEDULE: (principal, schedule) => flattenValues([schedule]).reduce((total, rate) => total * (1 + normalizeRate(rate)), toNumber(principal)),
  DAYS360: (startDate, endDate) => days360(startDate, endDate),
  NETWORKDAYS: (startDate, endDate, holidays = []) => networkDays(startDate, endDate, holidays),
  WORKDAY: (startDate, days = 0, holidays = []) => workDay(startDate, days, holidays),
  YEARFRAC: (startDate, endDate, basis = 0) => yearFrac(startDate, endDate, basis),
  DATEDIF: (startDate, endDate, unit = 'D') => datedif(startDate, endDate, unit),
  IVA: (base, rate = 0.16) => toNumber(base) * normalizeRate(rate),
  PRECIOCONIVA: (base, rate = 0.16) => toNumber(base) * (1 + normalizeRate(rate)),
  SINIVA: (total, rate = 0.16) => safeDivide(total, 1 + normalizeRate(rate)),
  IMPUESTO: (base, rate) => toNumber(base) * normalizeRate(rate),
  DESCUENTO: (amount, rate) => toNumber(amount) * (1 - normalizeRate(rate)),
  MONTO_DESCUENTO: (amount, rate) => toNumber(amount) * normalizeRate(rate),
  MARGEN: (price, cost) => safeDivide(toNumber(price) - toNumber(cost), price, 0),
  MARKUP: (price, cost) => safeDivide(toNumber(price) - toNumber(cost), cost, 0),
  UTILIDAD: (price, cost, quantity = 1) => (toNumber(price) - toNumber(cost)) * toNumber(quantity),
  UTILIDADPORC: (price, cost) => safeDivide(toNumber(price) - toNumber(cost), price, 0) * 100,
  COSTO_TOTAL: (cost, quantity) => toNumber(cost) * toNumber(quantity),
  VENTA_TOTAL: (price, quantity = 1, discount = 0, tax = 0) => (toNumber(price) * toNumber(quantity) * (1 - normalizeRate(discount))) * (1 + normalizeRate(tax)),
  PUNTOEQUILIBRIO: (fixedCosts, price, variableCost) => safeDivide(fixedCosts, toNumber(price) - toNumber(variableCost)),
  ROTACION: (costOfGoodsSold, averageInventory) => safeDivide(costOfGoodsSold, averageInventory, 0),
  DIASCARTERA: (accountsReceivable, sales, days = 365) => safeDivide(toNumber(accountsReceivable) * toNumber(days), sales, 0),
  RAZONCORRIENTE: (currentAssets, currentLiabilities) => safeDivide(currentAssets, currentLiabilities, 0),
  PRUEBAACIDA: (currentAssets, inventory, currentLiabilities) => safeDivide(toNumber(currentAssets) - toNumber(inventory), currentLiabilities, 0),
  ENDEUDAMIENTO: (totalLiabilities, totalAssets) => safeDivide(totalLiabilities, totalAssets, 0),
  ROI: (gain, investment) => safeDivide(toNumber(gain) - toNumber(investment), investment, 0),
  ROA: (netIncome, totalAssets) => safeDivide(netIncome, totalAssets, 0),

  SUBTOTAL: (functionNum, ...values) => subtotalByCode(functionNum, ...values),
  SUMPRODUCT: (...arrays) => sumProduct(...arrays),
  COUNTBLANK: (...values) => flattenValues(values).filter((value) => value === null || value === undefined || value === '').length,
  FREQUENCY: (dataArray, binsArray) => frequency(dataArray, binsArray),
  PERCENTRANK: (values, x) => percentRank(values, x),
  COVARIANCE: (array1, array2) => covariance(array1, array2),
  CORREL: (array1, array2) => correl(array1, array2),
  GEOMEAN: (...values) => { const nums = numberValues(values).filter((value) => value > 0); return nums.length ? nums.reduce((product, value) => product * value, 1) ** (1 / nums.length) : '#NUM!'; },
  HARMEAN: (...values) => { const nums = numberValues(values).filter((value) => value > 0); return nums.length ? nums.length / nums.reduce((sum, value) => sum + (1 / value), 0) : '#NUM!'; },
  XNPV: (rate, values, dates) => xnpv(rate, values, dates),
  XIRR: (values, dates, guess = 0.1) => xirr(values, dates, guess),
  DISC: (settlement, maturity, pr, redemption, basis = 0) => safeDivide(toNumber(redemption) - toNumber(pr), toNumber(redemption), 0) * safeDivide(360, Math.max(1, dateDiffDays(settlement, maturity)), 0),
  INTRATE: (settlement, maturity, investment, redemption, basis = 0) => safeDivide(toNumber(redemption) - toNumber(investment), toNumber(investment), 0) * safeDivide(365, Math.max(1, dateDiffDays(settlement, maturity)), 0),
  RECEIVED: (settlement, maturity, investment, discount, basis = 0) => safeDivide(investment, 1 - normalizeRate(discount) * safeDivide(dateDiffDays(settlement, maturity), 360, 0), '#DIV/0!'),
  DURATION: (settlement, maturity, coupon, yld, frequency = 1, basis = 0) => { const n = bondPeriods(settlement, maturity, frequency); const r = normalizeRate(yld) / toNumber(frequency || 1); const c = normalizeRate(coupon) / toNumber(frequency || 1) * 100; let pvTotal = 0; let weighted = 0; for (let t = 1; t <= n; t += 1) { const cash = t === n ? c + 100 : c; const pv = cash / ((1 + r) ** t); pvTotal += pv; weighted += t * pv; } return safeDivide(weighted, pvTotal, 0) / toNumber(frequency || 1); },
  MDURATION: (settlement, maturity, coupon, yld, frequency = 1, basis = 0) => safeDivide(SAFE_FORMULA_FUNCTIONS.DURATION(settlement, maturity, coupon, yld, frequency, basis), 1 + normalizeRate(yld) / toNumber(frequency || 1), 0),
  PRICEDISC: (settlement, maturity, discount, redemption = 100, basis = 0) => toNumber(redemption) * (1 - normalizeRate(discount) * safeDivide(dateDiffDays(settlement, maturity), 360, 0)),
  YIELDDISC: (settlement, maturity, pr, redemption = 100, basis = 0) => safeDivide(toNumber(redemption) - toNumber(pr), pr, 0) * safeDivide(360, Math.max(1, dateDiffDays(settlement, maturity)), 0),
  TBILLPRICE: (settlement, maturity, discount) => 100 * (1 - normalizeRate(discount) * safeDivide(dateDiffDays(settlement, maturity), 360, 0)),
  TBILLYIELD: (settlement, maturity, price) => safeDivide(100 - toNumber(price), price, 0) * safeDivide(360, Math.max(1, dateDiffDays(settlement, maturity)), 0),
  TBILLEQ: (settlement, maturity, discount) => { const dsm = Math.max(1, dateDiffDays(settlement, maturity)); const disc = normalizeRate(discount); return (365 * disc) / (360 - disc * dsm); },
  SUBTOTAL_FACTURA: (total, ivaRate = 0.16, retIvaRate = 0, retIsrRate = 0) => safeDivide(total, 1 + normalizeRate(ivaRate) - normalizeRate(retIvaRate) - normalizeRate(retIsrRate), 0),
  TOTAL_FACTURA: (subtotal, ivaRate = 0.16, retIvaRate = 0, retIsrRate = 0) => toNumber(subtotal) * (1 + normalizeRate(ivaRate) - normalizeRate(retIvaRate) - normalizeRate(retIsrRate)),
  RETENCION_IVA: (base, rate = 0.106667) => toNumber(base) * normalizeRate(rate),
  RETENCION_ISR: (base, rate = 0.0125) => toNumber(base) * normalizeRate(rate),
  IVA16: (base) => toNumber(base) * 0.16,
  IVA8: (base) => toNumber(base) * 0.08,
  BASE_DESDE_TOTAL: (total, taxRate = 0.16) => safeDivide(total, 1 + normalizeRate(taxRate), 0),
  REDONDEO_FISCAL: (amount, digits = 2) => Number(toNumber(amount).toFixed(Number(digits || 2))),
  DIFERENCIA: (value1, value2) => Math.abs(toNumber(value1) - toNumber(value2)),
  CONCILIADO: (value1, value2, tolerance = 0.01) => Math.abs(toNumber(value1) - toNumber(value2)) <= toNumber(tolerance),
  SALDO: (debe, haber, initial = 0) => toNumber(initial) + toNumber(debe) - toNumber(haber),
  DEUDOR_ACREEDOR: (debe, haber, initial = 0) => { const saldo = SAFE_FORMULA_FUNCTIONS.SALDO(debe, haber, initial); return saldo > 0 ? 'Deudor' : saldo < 0 ? 'Acreedor' : 'Saldado'; },
  VARIACION: (actual, previous) => toNumber(actual) - toNumber(previous),
  VARIACIONPORC: (actual, previous) => safeDivide(toNumber(actual) - toNumber(previous), previous, 0),
  PORCENTAJE: (part, total) => safeDivide(part, total, 0),
  PROMEDIO_PONDERADO: (values, weights) => averageWeighted(values, weights),
  COSTO_PROMEDIO: (costs, quantities) => averageWeighted(costs, quantities),
  MARGEN_BRUTO: (sales, cost) => safeDivide(toNumber(sales) - toNumber(cost), sales, 0),
  MARGEN_OPERATIVO: (operatingIncome, sales) => safeDivide(operatingIncome, sales, 0),
  MARGEN_NETO: (netIncome, sales) => safeDivide(netIncome, sales, 0),
  EBITDA: (operatingIncome, depreciation = 0, amortization = 0) => toNumber(operatingIncome) + toNumber(depreciation) + toNumber(amortization),
  EBITDA_MARGEN: (ebitda, sales) => safeDivide(ebitda, sales, 0),
  CAPITAL_TRABAJO: (currentAssets, currentLiabilities) => toNumber(currentAssets) - toNumber(currentLiabilities),
  APALANCAMIENTO: (totalAssets, equity) => safeDivide(totalAssets, equity, 0),
  COBERTURA_INTERESES: (ebit, interestExpense) => safeDivide(ebit, interestExpense, 0),
  DIO: (averageInventory, cogs, days = 365) => safeDivide(toNumber(averageInventory) * toNumber(days), cogs, 0),
  DPO: (accountsPayable, cogs, days = 365) => safeDivide(toNumber(accountsPayable) * toNumber(days), cogs, 0),
  CICLO_CONVERSION_EFECTIVO: (dio, dso, dpo) => toNumber(dio) + toNumber(dso) - toNumber(dpo),
  VENCIDO: (dueDate, asOf = new Date()) => dateDiffDays(dueDate, asOf) > 0,
  DIAS_VENCIDO: (dueDate, asOf = new Date()) => Math.max(0, Math.floor(dateDiffDays(dueDate, asOf))),
  ANTIGUEDAD_CARTERA: (dueDate, asOf = new Date()) => agingBucket(dueDate, asOf),
  PROVISION_CARTERA: (amount, daysOverdue) => { const days = toNumber(daysOverdue); const rate = days <= 0 ? 0 : days <= 30 ? 0.02 : days <= 60 ? 0.05 : days <= 90 ? 0.15 : 0.5; return toNumber(amount) * rate; },
  INTERES_MORATORIO: (amount, annualRate, days) => toNumber(amount) * normalizeRate(annualRate) * safeDivide(days, 365, 0),
  DESCUENTO_PRONTO_PAGO: (amount, discountRate, payDate, dueDate) => makeDate(payDate) <= makeDate(dueDate) ? toNumber(amount) * (1 - normalizeRate(discountRate)) : toNumber(amount),
  NOMINA_NETA: (gross, isr = 0, imss = 0, other = 0) => toNumber(gross) - toNumber(isr) - toNumber(imss) - toNumber(other),
  COMISION: (sales, rate, base = 0) => Math.max(0, toNumber(sales) - toNumber(base)) * normalizeRate(rate),
  PRESUPUESTO_VARIACION: (actual, budget) => toNumber(actual) - toNumber(budget),
  PRESUPUESTO_VARIACION_PORC: (actual, budget) => safeDivide(toNumber(actual) - toNumber(budget), budget, 0),

  AVERAGEA: (...values) => { const nums = logicalNumberValues(values); return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : '#DIV/0!'; },
  MAXA: (...values) => { const nums = logicalNumberValues(values); return nums.length ? Math.max(...nums) : 0; },
  MINA: (...values) => { const nums = logicalNumberValues(values); return nums.length ? Math.min(...nums) : 0; },
  SUMSQ: (...values) => numberValues(values).reduce((sum, value) => sum + value ** 2, 0),
  DEVSQ: (...values) => { const nums = numberValues(values); if (!nums.length) return 0; const avg = nums.reduce((s, v) => s + v, 0) / nums.length; return nums.reduce((s, v) => s + ((v - avg) ** 2), 0); },
  AVEDEV: (...values) => { const nums = numberValues(values); if (!nums.length) return '#DIV/0!'; const avg = nums.reduce((s, v) => s + v, 0) / nums.length; return nums.reduce((s, v) => s + Math.abs(v - avg), 0) / nums.length; },
  AGGREGATE: (functionNum, options, ...values) => aggregateByCode(functionNum, ...values),
  TEXT: (value, format) => formatTextValue(value, format),
  FIXED: (number, decimals = 2, noCommas = false) => toNumber(number).toLocaleString('es-MX', { useGrouping: !Boolean(noCommas), minimumFractionDigits: Math.max(0, Math.trunc(toNumber(decimals))), maximumFractionDigits: Math.max(0, Math.trunc(toNumber(decimals))) }),
  DOLLAR: (number, decimals = 2) => toNumber(number).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: Math.max(0, Math.trunc(toNumber(decimals))), maximumFractionDigits: Math.max(0, Math.trunc(toNumber(decimals))) }),
  NUMBERVALUE: (text, decimalSeparator = '.', groupSeparator = ',') => numberValue(text, decimalSeparator, groupSeparator),
  DATEVALUE: (dateText) => excelSerialDate(dateText),
  TIMEVALUE: (timeText) => { const date = new Date(`1970-01-01T${String(timeText)}`); return Number.isNaN(date.getTime()) ? '#VALUE!' : (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400; },
  WORKDAY_INTL: (startDate, days = 0, weekend = 1, holidays = []) => workDayIntl(startDate, days, weekend, holidays),
  NETWORKDAYS_INTL: (startDate, endDate, weekend = 1, holidays = []) => networkDaysIntl(startDate, endDate, weekend, holidays),
  EFFECTIVE_MONTHLY_RATE: (annualRate) => ((1 + normalizeRate(annualRate)) ** (1 / 12)) - 1,
  EFFECTIVE_ANNUAL_RATE: (monthlyRate) => ((1 + normalizeRate(monthlyRate)) ** 12) - 1,
  SIMPLE_INTEREST: (principal, annualRate, days) => toNumber(principal) * normalizeRate(annualRate) * safeDivide(days, 365, 0),
  COMPOUND_INTEREST: (principal, rate, periods) => toNumber(principal) * (((1 + normalizeRate(rate)) ** toNumber(periods)) - 1),
  FINAL_CAPITAL: (principal, rate, periods) => toNumber(principal) * ((1 + normalizeRate(rate)) ** toNumber(periods)),
  INITIAL_CAPITAL: (finalAmount, rate, periods) => safeDivide(finalAmount, ((1 + normalizeRate(rate)) ** toNumber(periods)), 0),
  IVA_TRASLADADO: (base, rate = 0.16) => toNumber(base) * normalizeRate(rate),
  IVA_ACREDITABLE: (base, rate = 0.16) => toNumber(base) * normalizeRate(rate),
  IVA_POR_PAGAR: (ivaTrasladado, ivaAcreditable) => toNumber(ivaTrasladado) - toNumber(ivaAcreditable),
  HONORARIOS_NETO: (base, iva = 0.16, retIva = 0.106667, retIsr = 0.10) => toNumber(base) * (1 + normalizeRate(iva) - normalizeRate(retIva) - normalizeRate(retIsr)),
  ISR_PROVISIONAL: (income, deductions = 0, rate = 0.30) => Math.max(0, toNumber(income) - toNumber(deductions)) * normalizeRate(rate),
  CONTRIBUCION_UNITARIA: (price, variableCost) => toNumber(price) - toNumber(variableCost),
  MARGEN_CONTRIBUCION: (price, variableCost) => safeDivide(toNumber(price) - toNumber(variableCost), price, 0),
  PUNTO_EQUILIBRIO_VENTAS: (fixedCosts, contributionMargin) => safeDivide(fixedCosts, contributionMargin, 0),
  DEPRECIACION_MENSUAL: (cost, salvage, months) => safeDivide(toNumber(cost) - toNumber(salvage), months, 0),
  DEPRECIACION_ACUMULADA: (cost, salvage, monthsTotal, monthsElapsed) => Math.min(toNumber(cost) - toNumber(salvage), safeDivide(toNumber(cost) - toNumber(salvage), monthsTotal, 0) * toNumber(monthsElapsed)),
  VALOR_LIBROS: (cost, accumulatedDepreciation) => toNumber(cost) - toNumber(accumulatedDepreciation),
  SALDO_FINAL: (initialBalance, charges = 0, credits = 0) => toNumber(initialBalance) + toNumber(charges) - toNumber(credits),
  CUADRA_DEBE_HABER: (debe, haber, tolerance = 0.01) => Math.abs(toNumber(debe) - toNumber(haber)) <= toNumber(tolerance),
  CONCILIACION_BANCARIA: (bookBalance, depositsInTransit = 0, outstandingChecks = 0, bankFees = 0, interest = 0) => toNumber(bookBalance) + toNumber(depositsInTransit) - toNumber(outstandingChecks) - toNumber(bankFees) + toNumber(interest),
  SALDO_INSOLUTO: (principal, rate, nper, paymentsMade) => { const payment = Math.abs(financePmt(rate, nper, principal)); return Math.max(0, financeFv(rate, paymentsMade, payment, -toNumber(principal))); },
  PAYBACK: (initialInvestment, cashflows) => cashflowPayback(initialInvestment, cashflows),
  PROFIT_FACTOR: (cashflows) => { const flows = flattenValues([cashflows]).map(toNumber); const gains = flows.filter((v) => v > 0).reduce((s, v) => s + v, 0); const losses = Math.abs(flows.filter((v) => v < 0).reduce((s, v) => s + v, 0)); return safeDivide(gains, losses, '#DIV/0!'); },
  COUPDAYS: (settlement, maturity, frequency = 1, basis = 0) => couponDays(settlement, maturity, frequency),
  COUPDAYBS: (settlement, maturity, frequency = 1, basis = 0) => { const days = couponDays(settlement, maturity, frequency); return Math.max(0, days - SAFE_FORMULA_FUNCTIONS.COUPDAYSNC(settlement, maturity, frequency, basis)); },
  COUPDAYSNC: (settlement, maturity, frequency = 1, basis = 0) => Math.max(0, Math.min(couponDays(settlement, maturity, frequency), dateDiffDays(settlement, maturity) % couponDays(settlement, maturity, frequency))),
  COUPNUM: (settlement, maturity, frequency = 1, basis = 0) => couponNumber(settlement, maturity, frequency),
  ACCRINTM: (issue, maturity, rate, par = 1000, basis = 0) => toNumber(par) * normalizeRate(rate) * yearFrac(issue, maturity, basis),
  ACCRINT: (issue, firstInterest, settlement, rate, par = 1000, frequency = 1, basis = 0) => toNumber(par) * normalizeRate(rate) * yearFrac(issue, settlement, basis),
  FILTER: (array, include, ifEmpty = '') => filterArray(array, include, ifEmpty),
  UNIQUE: (array) => uniqueArray(array),
  SORT: (array, sortIndex = 1, sortOrder = 1) => sortArray(array, sortIndex, sortOrder),
  TAKE: (array, rows, columns = null) => takeArray(array, rows, columns),
  DROP: (array, rows, columns = 0) => dropArray(array, rows, columns),

  STDEV_S: (...values) => stdev(values, true),
  STDEV_P: (...values) => stdev(values, false),
  VAR_S: (...values) => variance(values, true),
  VAR_P: (...values) => variance(values, false),
  PERCENTILE_INC: (values, k = 0) => percentile(values, k),
  PERCENTILE_EXC: (values, k = 0) => percentileExclusive(values, k),
  QUARTILE_INC: (values, quart = 1) => percentile(values, toNumber(quart) / 4),
  QUARTILE_EXC: (values, quart = 1) => percentileExclusive(values, toNumber(quart) / 4),
  PERCENTRANK_INC: (values, x, significance = 3) => percentRankDetailed(values, x, significance, false),
  PERCENTRANK_EXC: (values, x, significance = 3) => percentRankDetailed(values, x, significance, true),
  STANDARDIZE: (x, mean, standardDev) => safeDivide(toNumber(x) - toNumber(mean), standardDev),
  NORM_DIST: (x, mean, standardDev, cumulative = true) => Boolean(cumulative) ? normalCdf(x, mean, standardDev) : normalPdf(x, mean, standardDev),
  NORM_S_DIST: (z, cumulative = true) => Boolean(cumulative) ? normalCdf(z, 0, 1) : normalPdf(z, 0, 1),
  NORM_INV: (probability, mean, standardDev) => inverseNormal(probability, mean, standardDev),
  NORM_S_INV: (probability) => inverseNormal(probability, 0, 1),
  FORECAST_LINEAR: (x, knownY, knownX) => interceptValue(knownY, knownX) + slopeValue(knownY, knownX) * toNumber(x),
  SLOPE: (knownY, knownX) => slopeValue(knownY, knownX),
  INTERCEPT: (knownY, knownX) => interceptValue(knownY, knownX),
  RSQ: (knownY, knownX) => correlationValue(knownY, knownX) ** 2,
  FORECAST_ETS: (targetDate, values, timeline) => interceptValue(values, timeline) + slopeValue(values, timeline) * toNumber(targetDate),
  ISPMT: (rate, per, nper, pv) => -(toNumber(pv) * normalizeRate(rate) * (toNumber(nper) - toNumber(per)) / toNumber(nper)),
  CAGR: (beginValue, endValue, periods) => (toNumber(endValue) / toNumber(beginValue)) ** safeDivide(1, periods, 0) - 1,
  GROWTH_RATE: (newValue, oldValue) => safeDivide(toNumber(newValue) - toNumber(oldValue), oldValue, 0),
  DSO: (accountsReceivable, creditSales, days = 365) => safeDivide(toNumber(accountsReceivable) * toNumber(days), creditSales, 0),
  INVENTORY_TURNOVER: (cogs, averageInventory) => safeDivide(cogs, averageInventory, 0),
  ASSET_TURNOVER: (sales, averageAssets) => safeDivide(sales, averageAssets, 0),
  DEBT_TO_EQUITY: (totalDebt, equity) => safeDivide(totalDebt, equity, 0),
  GROSS_PROFIT: (sales, cost) => toNumber(sales) - toNumber(cost),
  OPERATING_PROFIT: (grossProfit, operatingExpenses) => toNumber(grossProfit) - toNumber(operatingExpenses),
  NET_PROFIT: (income, expenses = 0, taxes = 0) => toNumber(income) - toNumber(expenses) - toNumber(taxes),
  BREAK_EVEN_UNITS: (fixedCosts, price, variableCost) => safeDivide(fixedCosts, toNumber(price) - toNumber(variableCost), 0),
  SAFETY_MARGIN: (actualSales, breakEvenSales) => safeDivide(toNumber(actualSales) - toNumber(breakEvenSales), actualSales, 0),
  VAT_INCLUDED_RATE: (total, base) => safeDivide(toNumber(total) - toNumber(base), base, 0),
  PRORATE: (amount, weight, totalWeight) => toNumber(amount) * safeDivide(weight, totalWeight, 0),
  ALLOCATE_BY_WEIGHT: (totalAmount, weights) => arrayToDisplay([flattenValues([weights]).map((weight) => toNumber(totalAmount) * safeDivide(weight, SAFE_FORMULA_FUNCTIONS.SUM(weights), 0))]),
  AGING_BUCKET: (daysOverdue) => { const days = toNumber(daysOverdue); return days <= 0 ? 'Vigente' : days <= 30 ? '1-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+'; },
  TEXTBEFORE: (text, delimiter) => textBefore(text, delimiter),
  TEXTAFTER: (text, delimiter) => textAfter(text, delimiter),
  TEXTSPLIT: (text, delimiter) => textSplit(text, delimiter),
  TRIMMEAN: (values, percent = 0) => trimMean(values, percent),
  CHOOSECOLS: (array, ...cols) => chooseCols(array, ...cols),
  CHOOSEROWS: (array, ...rowsArg) => chooseRows(array, ...rowsArg),
  TRANSPOSE: (array) => transposeArray(array),
  HSTACK: (...arrays) => hStack(...arrays),
  VSTACK: (...arrays) => vStack(...arrays),
  XMATCH: (lookupValue, lookupArray, matchMode = 0, searchMode = 1) => xmatch(lookupValue, lookupArray, matchMode, searchMode),
  ISLOGICAL: (value) => typeof value === 'boolean',
  ISEVEN: (value) => Math.trunc(toNumber(value)) % 2 === 0,
  ISODD: (value) => Math.abs(Math.trunc(toNumber(value)) % 2) === 1,
  ISNONTEXT: (value) => typeof value !== 'string',
  ISOWEEKNUM: (value) => isoWeekNumber(value),
  FACT: (number) => factorialNumber(number),
  FACTDOUBLE: (number) => doubleFactorialNumber(number),
  COMBIN: (number, chosen) => combinNumber(number, chosen, false),
  COMBINA: (number, chosen) => combinNumber(number, chosen, true),
  PERMUT: (number, chosen) => permutNumber(number, chosen, false),
  PERMUTATIONA: (number, chosen) => permutNumber(number, chosen, true),
  MULTINOMIAL: (...values) => { const nums = numberValues(values); return safeDivide(factorialNumber(nums.reduce((s, v) => s + v, 0)), nums.reduce((p, v) => p * factorialNumber(v), 1), '#DIV/0!'); },
  QUOTIENT: (numerator, denominator) => Math.trunc(safeDivide(numerator, denominator, 0)),
  BASE: (number, radix = 10, minLength = 0) => Math.trunc(toNumber(number)).toString(Math.trunc(toNumber(radix))).toUpperCase().padStart(Math.max(0, Math.trunc(toNumber(minLength))), '0'),
  DECIMAL: (text, radix = 10) => parseInt(String(text || ''), Math.trunc(toNumber(radix))) || 0,
  ROMAN: (number) => romanNumber(number),
  ARABIC: (text) => arabicNumber(text),
  CEILING_MATH: (value, significance = 1) => SAFE_FORMULA_FUNCTIONS.CEILING(value, Math.abs(toNumber(significance || 1))),
  FLOOR_MATH: (value, significance = 1) => SAFE_FORMULA_FUNCTIONS.FLOOR(value, Math.abs(toNumber(significance || 1))),
  ISO_CEILING: (value, significance = 1) => SAFE_FORMULA_FUNCTIONS.CEILING(value, Math.abs(toNumber(significance || 1))),
  TIME: (hour = 0, minute = 0, second = 0) => safeDivide(toNumber(hour) * 3600 + toNumber(minute) * 60 + toNumber(second), 86400, 0),
  IFNA: (value, fallback = '') => String(value) === '#N/A' ? fallback : value,
  ISERR: (value) => String(value || '').startsWith('#') && String(value) !== '#N/A',
  ISDATE: (value) => isDateLike(value),
  ISFORMULA: () => false,
  N: (value) => value instanceof Date ? excelSerialDate(value) : typeof value === 'boolean' ? (value ? 1 : 0) : isNumericValue(value) ? toNumber(value) : 0,
  T: (value) => typeof value === 'string' ? value : '',
  CHAR: (number) => String.fromCharCode(Math.trunc(toNumber(number))),
  CODE: (text) => String(text || '').charCodeAt(0) || '#VALUE!',
  UNICHAR: (number) => String.fromCodePoint(Math.trunc(toNumber(number))),
  UNICODE: (text) => String(text || '').codePointAt(0) || '#VALUE!',
  RECEIVED_RATE: (investment, received, days) => ((toNumber(received) / toNumber(investment)) - 1) * safeDivide(365, days, 0),
  EFFECTIVE_RATE_PERIOD: (annualRate, periodsPerYear = 12) => ((1 + normalizeRate(annualRate)) ** safeDivide(1, periodsPerYear, 0)) - 1,
  AMORTIZATION_PAYMENT: (principal, annualRate, periods) => Math.abs(financePmt(safeDivide(normalizeRate(annualRate), 12, 0), periods, principal)),
  RUNNING_TOTAL: (values) => runningTotal(values),
  PERCENT_OF_TOTAL: (value, total) => safeDivide(value, total, 0),
  WEIGHTED_AVERAGE: (values, weights) => { const v = flattenValues([values]).map(toNumber); const w = flattenValues([weights]).map(toNumber); const totalWeight = w.reduce((s, x) => s + x, 0); return safeDivide(v.reduce((s, x, i) => s + x * (w[i] || 0), 0), totalWeight, 0); },
  SEQUENCE: (rows = 1, columns = 1, start = 1, step = 1) => sequenceArray(rows, columns, start, step),
  TOCOL: (array) => arrayToDisplay(flattenValues([array]).map((value) => [value])),
  TOROW: (array) => arrayToDisplay([flattenValues([array])]),
  WRAPROWS: (array, count = 1) => wrapVector(array, count, true),
  WRAPCOLS: (array, count = 1) => wrapVector(array, count, false),
  ROE: (netIncome, equity) => safeDivide(netIncome, equity, 0),
};

export function evaluateFormula(formula, grid, context = {}, visited = new Set()) {
  if (!formula || !String(formula).trim().startsWith('=')) return formula || '';

  let expression = stripFormulaSpaces(String(formula).trim().slice(1));
  if (!expression) return '';

  const singleReferenceMatch = expression.match(/^((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)!?)?(\$?[A-Z]+\$?\d+)$/i);
  if (singleReferenceMatch) {
    const [, sheetPrefix = '', cellId] = singleReferenceMatch;
    const value = getCellRawValue(grid, cellId, context, sheetPrefix, visited);
    return value === null || value === undefined ? '' : String(value);
  }

  expression = replaceRangeFunctions(expression, grid, context, visited);
  expression = replaceRangeReferences(expression, grid, context, visited);
  expression = normalizeFunctionNames(expression);
  expression = replaceCellReferences(expression, grid, context, visited);
  expression = normalizeExcelOperators(expression);

  if (!/^[0-9A-Z_ÁÉÍÓÚÑ.,:+\-*/()<>!=\s'"%\[\]]*$/i.test(expression)) return '#ERROR';

  try {
    const names = Object.keys(SAFE_FORMULA_FUNCTIONS);
    const values = Object.values(SAFE_FORMULA_FUNCTIONS);
    // Evaluador limitado a funciones permitidas, literales y operadores básicos.
    // eslint-disable-next-line no-new-func
    const result = Function(...names, `"use strict"; return (${expression});`)(...values);
    return formatFormulaResult(result);
  } catch {
    return '#ERROR';
  }
}

export function formatSpreadsheetValue(value) {
  if (value === null || value === undefined || value === '') return '';

  const text = String(value).trim();

  // Solo formatea números simples. No toca códigos, IDs, teléfonos ni textos.
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return value;

  const number = Number(text);
  if (!Number.isFinite(number)) return value;

  return number.toLocaleString('en-US', {
    maximumFractionDigits: 8,
    useGrouping: true,
  });
}

export function displayCell(cell, grid, context = {}) {
  const value = cell?.formula ? evaluateFormula(cell.formula, grid, context) : (cell?.value ?? '');
  return formatSpreadsheetValue(value);
}

export function adjustFormulaReferences(formula, rowDelta = 0, colDelta = 0) {
  if (!formula || !String(formula).startsWith('=')) return formula || '';

  const cellReferencePattern = /((?:'[^']+'|[A-Z0-9_ÁÉÍÓÚÑ ]+)!?)?(\$?)([A-Z]+)(\$?)(\d+)/gi;

  return String(formula).replace(
    cellReferencePattern,
    (match, sheetPrefix = '', colAbsolute = '', letters = '', rowAbsolute = '', rowNumber = '') => {
      const parsed = parseCellId(`${letters}${rowNumber}`);
      if (!parsed) return match;

      const nextCol = colAbsolute ? parsed.col : parsed.col + colDelta;
      const nextRow = rowAbsolute ? parsed.row : parsed.row + rowDelta;

      if (nextCol < 0 || nextRow < 0) return match;

      return `${sheetPrefix || ''}${colAbsolute}${columnIndexToLetter(nextCol)}${rowAbsolute}${nextRow + 1}`;
    },
  );
}

export function quoteSheetName(name = '') {
  const clean = String(name || 'Hoja').trim();
  return /^[A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+$/.test(clean) ? clean : `'${clean.replaceAll("'", "''")}'`;
}

export function makeWorkbookContext({ sheets = [], gridsBySheet = {}, activeSheetId = null, activeGrid = null } = {}) {
  return {
    sheets,
    gridsBySheet,
    activeSheetId,
    activeGrid: activeGrid || (activeSheetId ? gridsBySheet[activeSheetId] : null),
  };
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}
