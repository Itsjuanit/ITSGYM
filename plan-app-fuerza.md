# Plan de producto y desarrollo — Fuerza en casa

Para Juan Ignacio Tejada · 10 de septiembre de 2026

Estado: plan listo para implementar. No se ha construido ni publicado la app. React + Vite es el stack solicitado; interpreto «vote» como Vite.

## 1. Objetivo y límites concretos

Una web app mobile first, en español, para realizar y guardar tres sesiones semanales de fuerza en casa, usando una única mancuerna fija de 7 kg y peso corporal. Debe convivir con el pádel y ayudar a observar constancia, rendimiento y evolución del peso corporal.

La primera versión debe permitir completar el ciclo entero: ver qué toca, entrenar con instrucciones, registrar series, interrumpir y retomar, terminar, consultar el historial y recuperar los datos desde un respaldo.

Supuestos editables: sesiones de 30–40 minutos; ejemplo de calendario lunes/miércoles/viernes para fuerza y martes/jueves para pádel. Los días de pádel todavía no están confirmados. No se presupone banco, bandas, segunda mancuerna ni otro equipo. No se usan medidas corporales antiguas: el peso actual se registra opcionalmente.

## 2. Filosofía Ponytail aplicada

Revisé [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) y su [skill principal](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md). Es una guía de trabajo para agentes de programación: entender primero, cuestionar lo innecesario, reutilizar y elegir recursos nativos antes de sumar código o dependencias. No es una librería fitness. Su minimalismo preserva validación, accesibilidad y protección frente a pérdida de datos.

Aplicación al proyecto, como decisiones propias:

- Una persona, un catálogo revisado y tres plantillas editables.
- Entrenamientos estables; cambios basados en registros y aceptados por el usuario.
- Datos locales y respaldo desde la primera versión.
- Controles HTML y CSS para formularios, navegación y semana.
- Dependencias nuevas solo cuando ahorran complejidad real.
- Cada entrega resuelve un recorrido usable, con una comprobación de sus riesgos principales.

## 3. Alcance de la primera versión usable

| Área | Funciones incluidas |
|---|---|
| Perfil | Equipo fijo, días de fuerza y pádel, duración preferida y objetivo. Peso corporal opcional. |
| Hoy | Próxima rutina A/B/C, duración orientativa, última sesión y botón Empezar o Continuar. |
| Semana | Fuerza, pádel y descanso; mover sesiones; registrar duración y esfuerzo del pádel. |
| Rutinas | Consultar A/B/C; reordenar, reemplazar por alternativas compatibles y ajustar series, repeticiones o descansos. |
| Entrenamiento | Instrucciones e imágenes, registro por serie y lado, temporizador, pausa, omitir, deshacer y finalizar. |
| Historial | Sesiones completas y parciales, detalle, edición de errores y eliminación confirmada. |
| Progreso | Sesiones semanales, rendimiento por ejercicio/variante y registro opcional de peso con tendencia. |
| Respaldo | Exportar/importar JSON validado; mostrar fecha del último respaldo y errores de guardado. |
| PWA | Instalación donde el navegador la permita; sesiones e imágenes seleccionadas disponibles sin conexión tras descargarse. |

Navegación inferior: Hoy, Plan, Historial y Progreso. Ajustes desde un botón secundario. El catálogo aparece al consultar o reemplazar un ejercicio.

## 4. Experiencia mobile first

Diseñar primero a 360 px de ancho y verificar a 320, 390 y 430 px; escritorio como adaptación posterior. Una columna, texto legible, controles táctiles de al menos 44 × 44 px y acción principal accesible cerca del pulgar. Respetar las zonas seguras del teléfono y el teclado virtual.

Durante el entrenamiento se muestra un ejercicio a la vez: nombre, objetivo, demostración, indicaciones breves y series. Cada lado debe identificarse con texto, no solo color. Ejemplo: «Remo · 7 kg · izquierda: 10 / derecha: 10». No multiplicar el peso por dos por trabajar ambos lados.

Mostrar las repeticiones anteriores como referencia, nunca registrarlas como realizadas automáticamente. Una serie solo cuenta cuando se confirma. Permitir corregir una pulsación sin rehacer la sesión.

El temporizador debe basarse en la hora de finalización persistida, no en contar ticks de JavaScript. Al volver desde otra app se recalcula. Sonido y vibración son opcionales y dependen del navegador; no prometer una alarma con la pantalla bloqueada. La actualización de la PWA se ofrece fuera de una sesión activa.

Accesibilidad: etiquetas, foco visible, contraste adecuado, ampliación de texto y movimiento reducido. Los estados guardando/guardado/error deben ser explícitos. Si falla la escritura, conservar la edición en memoria, permitir reintento y ofrecer exportación; no marcar éxito ficticio.

## 5. Contenido y Free Exercise DB

[Free Exercise DB](https://github.com/yuhonas/free-exercise-db) ofrece más de 800 ejercicios en JSON con instrucciones e imágenes. Es una base de contenido, no un planificador ni un entrenador. Su [esquema](https://github.com/yuhonas/free-exercise-db/blob/main/schema.json) incluye equipo y músculos, pero no un campo que garantice el uso de una única mancuerna.

Seleccionar aproximadamente 15–20 ejercicios; comprobar manualmente equipo completo, cantidad de mancuernas, posición, dificultad e imágenes. Conservar identificador y revisión de origen. Traducir y revisar el texto. El repositorio declara Unlicense; conservar la referencia y revisar la procedencia de los recursos que se incorporen.

Añadir solo los metadatos necesarios: nombre español, patrón de movimiento, cantidad de mancuernas, equipo adicional, ejecución por lados, unidad de registro (repeticiones o segundos), variante, instrucciones revisadas y alternativas aprobadas. Un ejercicio sin revisar no entra al catálogo disponible.

Guardar los JSON e imágenes seleccionados con la app, sin consultas a GitHub durante cada sesión. Si una imagen muestra dos mancuernas o un banco, no presentarla como demostración exacta de una variante sin ese equipo. Una variante nueva requiere texto y demostración coherentes antes de habilitarse.

## 6. Planificación y progresión

Propuesta de estructura a validar con la experiencia y tolerancia actuales: tres sesiones de cuerpo completo A/B/C, con énfasis distinto y movimientos repetibles para comparar progreso. Cubrir sentadilla, bisagra de cadera, empuje, tirón y abdomen, usando solo variantes revisadas. Calentamiento y cierre forman parte de cada sesión.

Este documento define el software; las dosis exactas de entrenamiento se fijan al preparar las plantillas, con información de experiencia, molestias y tiempo disponible. No asignar automáticamente ejercicios por encima de la cabeza o variantes avanzadas solo porque aparecen en la base. Una carga de 7 kg puede resultar demasiado alta para un movimiento y insuficiente para otro.

La orientación general de incluir trabajo de los principales grupos musculares al menos dos días por semana coincide con las [guías para adultos de CDC](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html). No implica que tres sesiones intensas sean adecuadas con cualquier carga de pádel.

Reglas propuestas para la app, inicialmente conservadoras y revisables:

1. Mostrar lo realizado anteriormente en la misma variante, junto con la dificultad percibida.
2. Si el usuario informa dolor, no sugerir aumentar dificultad; permitir detener u omitir y registrar la molestia. La app no diagnostica.
3. Si hay fatiga por pádel, ofrecer mantener, usar una versión corta previamente definida o reprogramar. El usuario elige.
4. Sugerir aumentar repeticiones dentro del rango fijado solo después de dos sesiones comparables completadas con buena técnica declarada y dificultad manejable. Es una regla de producto, no una fórmula fisiológica universal.
5. Al alcanzar el techo, ofrecer una variante previamente aprobada o revisar el plan. No aumentar series indefinidamente ni recortar descansos como respuesta universal.
6. No sugerir 8 kg ni una segunda mancuerna. Indicar cuándo el equipo disponible limita la progresión.
7. Una sesión perdida no genera dobles sesiones obligatorias. Una sesión parcial deja elegir repetirla o avanzar; la secuencia nunca cambia silenciosamente.

Registrar peso corporal es opcional y sirve para observar tendencia, no para estimar músculo ganado. No calcular calorías quemadas o fechas de adelgazamiento sin base suficiente. La pérdida de peso también depende de la alimentación y del balance energético, como explica [CDC](https://www.cdc.gov/healthy-weight-growth/physical-activity/index.html). La app no promete resultados corporales específicos.

## 7. Stack y arquitectura

| Pieza | Decisión y motivo |
|---|---|
| Interfaz | React + Vite + TypeScript; tipos para distinguir objetivos, datos realizados y estados de sesión. |
| Estilos | CSS con variables, Flexbox y Grid; evitar una biblioteca de componentes completa para estas pantallas. |
| Navegación | React Router para rutas reales y botón Atrás coherente. |
| Datos | IndexedDB mediante Dexie; reduce el código de transacciones, consultas y migraciones. |
| Offline | vite-plugin-pwa para manifiesto y caché de app/contenido. |
| Estado | Estado local de React; Dexie como fuente de registros persistentes. No duplicar el historial en un store global. |
| Gráficos iniciales | Resúmenes numéricos y listas; incorporar una librería de gráficos cuando se defina una visualización que la justifique. |
| Hosting | Sitio estático HTTPS con acceso privado al publicarlo; comprobar que su configuración permite el offline requerido. |

Referencias técnicas: [Dexie](https://dexie.org/) y [Vite PWA](https://vite-pwa-org.netlify.app/guide/). No se fijan versiones sin comprobar compatibilidad al iniciar la implementación; se conservará el lockfile.

Organización orientativa: páginas por recorrido, componentes reutilizados realmente (tarjeta de ejercicio, fila de serie, descanso), catálogo JSON y módulos pequeños para persistencia y selección de próxima sesión. Evitar capas genéricas, motores de plugins y adaptadores para servicios todavía inexistentes.

## 8. Datos y conservación de sesiones

| Entidad | Datos mínimos |
|---|---|
| Perfil | Días, duración, equipo fijo y preferencias. |
| Ejercicio | ID, fuente, instrucciones, variante, imágenes, equipo, lados y unidad. |
| Plantilla | A/B/C, versión y ejercicios ordenados con sus objetivos. |
| Sesión | UUID, estado, fechas, duración activa, copia de la plantilla, ejercicios/series realizados, dificultad y notas. |
| Pádel | ID, fecha, minutos y esfuerzo percibido. |
| Peso corporal | ID, fecha local, kg y nota opcional. |

Cada sesión guarda una copia de la prescripción y de las variantes usadas. Editar una plantilla no reescribe el pasado. Cada serie distingue objetivo y resultado real; admite izquierda/derecha, segundos o repeticiones según el ejercicio. La carga es 7 kg o ejecución sin carga externa. No atribuir 0 kg como peso corporal real.

Estados: en curso, pausada, completada y parcial. Guardar tras cada cambio confirmado y conservar la última sesión para retomar. Finalizar dos veces o tocar rápidamente no crea duplicados. Un único entrenamiento activo; segunda pestaña en lectura mientras otra lo edita, usando un mecanismo de bloqueo de plataforma con alternativa verificada.

Fechas: guardar instantes y fecha local de la sesión para evitar que un entrenamiento nocturno cambie de día al representarse en UTC. La duración activa excluye pausas explícitas y permanece recuperable al recargar.

## 9. Respaldo, privacidad y límites del modo local

Los datos quedan en ese navegador y origen. No se sincronizan con otro teléfono. Borrar los datos del sitio o una limpieza del navegador puede eliminarlos; solicitar persistencia cuando sea compatible y ofrecer respaldo desde el primer uso con registros.

Exportar un JSON versionado con perfil, plantillas personalizadas, sesiones, pádel y medidas. No necesita incluir las imágenes empaquetadas. Importar validando tamaño, estructura, versión, fechas y números antes de escribir. Mostrar resumen; para la primera versión usar restauración por reemplazo explícita, con posibilidad de exportar lo actual. La operación debe ser transaccional: si falla, lo anterior permanece intacto. No incorporar combinaciones complejas de respaldos todavía.

Sin analítica ni envío de registros a terceros en la primera versión. El acceso privado del hosting protege la entrada al sitio; la copia offline sigue dependiendo del bloqueo del teléfono. No prometer cifrado local o acceso biométrico que no estén implementados.

## 10. Entregas y criterios de aceptación

| Orden | Entrega | Se acepta cuando… |
|---|---|---|
| 1 | Catálogo revisado y tres plantillas | Todos los ejercicios corresponden al equipo; texto e imagen coinciden; alternativa y unidad están claras. |
| 2 | Recorrido móvil de una sesión | Abrir Hoy, iniciar, registrar ambos lados, descansar y finalizar funciona en ancho de teléfono. |
| 3 | Persistencia e historial | Recargar o cerrar conserva el último cambio confirmado; reanudar, editar y finalizar no duplica sesiones. |
| 4 | Plan, pádel y progreso | Reprogramar no altera el historial; sesiones parciales y variantes se comparan correctamente. |
| 5 | Offline, respaldo y uso privado | Sin red se puede completar una sesión; restaurar recupera datos; publicar mantiene las condiciones de acceso acordadas. |

Verificación enfocada: comprobaciones pequeñas para secuencia A/B/C, guardado idempotente, registro por lado y restauración rechazada sin pérdida. Un recorrido completo en navegador móvil cubre recarga, pausas, segundo acceso y modo avión. Probar que el temporizador se recalcula al volver del fondo, que las actualizaciones no interrumpen sesiones y que las fechas cercanas a medianoche no cambian de día.

La versión 1 está terminada cuando puede usarse una semana real: tres sesiones guardadas, pádel registrado, historial consistente y respaldo recuperable. No basta con que las pantallas se vean terminadas.

## 11. Qué se agrega cuando exista una necesidad concreta

- Sincronización y autenticación propias: cuando se necesite el mismo historial en varios dispositivos.
- Notificaciones push: cuando el calendario visible no alcance y tras comprobar soporte móvil.
- Más equipamiento: cuando haya una compra real.
- Gráficos avanzados: cuando el historial y una pregunta concreta los justifiquen.
- Integraciones con relojes o apps: cuando se defina un dato que valga la pena importar.

Quedan fuera de esta primera versión: red social, rankings, pagos, chat con IA, generación aleatoria de rutinas, contador nutricional completo y estimaciones ficticias de grasa o masa muscular. El esfuerzo se concentra en entrenar, registrar y conservar los datos.

## 12. Datos pendientes para preparar las rutinas

Confirmar al iniciar la preparación del contenido: días exactos de pádel, duración disponible, experiencia actual de fuerza y molestias o limitaciones relevantes. Estas respuestas ajustan las plantillas; no bloquean construir la estructura de la app. Android/iPhone se confirma para la verificación de instalación y temporizadores.

Siguiente paso implementable: seleccionar el catálogo mínimo y completar un recorrido vertical de la sesión A con guardado y reanudación, antes de ampliar al resto de pantallas.
