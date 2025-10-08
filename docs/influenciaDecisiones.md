# 3. Arquitectura base
## 3.1 Análisis de la influencia de decisiones de diseño en los QA's
En la presente sección se explorarán las decisiones de diseño identificadas en la arquitectura base y a su impacto sobre los atrbutos de calidad estudiados.

## 3.1.1 Incorporación del stack de monitoreo cAdvisor + Artillery + StatsD + Graphite + Grafana

El sistema actual presenta un stack de observabilidad para medir, almacenar y visualizar métricas en tiempo real. En concreto:
- cAdvisor: mide métricas de contenedores (CPU, memoria, etc.).

- Artillery: genera carga (testing de rendimiento).

- StatsD + Graphite: recolectan y almacenan métricas.

- Grafana: visualiza las métricas.

Esta decisión implicó agregar tres nuevos contenedores, configuraciones adicionales, puertos, conexiones en red internas de Docker y dependencias entre servicios, lo cual impactó de diferentes formas a distintos *stakeholders*.

---

### Impactos identificados

- **Carga cognitiva alta:**  
  Implicó que desarrolladores y arquitectos del sistema deban comprender cómo se conectan las herramientas, qué hace cada una y cómo interpretar los datos generados.  
  Esto impacta la **usabilidad interna** (para el desarrollador), la **manejabilidad** y la **simplicidad** del sistema, que originalmente se componía solo de un backend y un proxy inverso (Nginx).

- **Complejidad operativa:**  
  Más contenedores implican más puertos, configuraciones y *logs* extensos (en particular en el entorno local del trabajo práctico), lo cual aumenta el esfuerzo de *debugging* y de gestión general.  
  Esto afecta negativamente la **manejabilidad**, dado que se incrementa la complejidad operativa y el tiempo requerido para mantener el sistema.

- **Evaluación y visibilidad del comportamiento del sistema:**  
  Cuando el stack se encuentra correctamente configurado, las métricas permiten monitorear el rendimiento, detectar cuellos de botella y observar cómo interactúan los distintos componentes.  
  Esto mejora la **visibilidad** del sistema y favorece la **confiabilidad**, ya que permite anticipar fallos o anomalías de comportamiento.  
  No obstante, la dependencia entre múltiples herramientas introduce el riesgo de obtener una visibilidad incompleta si alguno de los servicios del stack (por ejemplo, Graphite o StatsD) deja de funcionar.

- **Afectación a la disponibilidad:**  
  El aumento en la cantidad de servicios dependientes implica más puntos de falla. Si Graphite o StatsD se detienen, Grafana dejará de mostrar información actualizada.  
  Además, el tiempo de despliegue y recuperación ante fallos se incrementa, afectando la **disponibilidad** de manera negativa, sobre todo en entornos locales.

- **Apoyo a la testeabilidad y diagnóstico:**  
  El stack de monitoreo potencia la capacidad de análisis durante pruebas de rendimiento (por ejemplo, al utilizar Artillery y observar las métricas en Grafana).  
  Esto facilita la identificación de comportamientos anómalos y la validación de la estabilidad del sistema, mejorando la **testeabilidad**.  
  Sin embargo, la infraestructura adicional necesaria para habilitar el monitoreo también introduce complejidad en el entorno de prueba, lo que puede dificultar la reproducibilidad y el control de los experimentos.

- **Seguridad y aislamiento:**  
  Añadir más servicios amplía la superficie de ataque, ya que cada contenedor es un proceso escuchando en distintos puertos internos.  
  Esto impacta la **seguridad operativa**, aunque su efecto sea poco relevante en entornos locales de desarrollo.

- **Impacto en la portabilidad del sistema:**  
  La cintainerización permite desplegar el stack completo en distintos entornos con relativa facilidad, lo cual favorece la **portabilidad técnica**.  
  Sin embargo, la fuerte interdependencia entre servicios y las configuraciones específicas de red, puertos y volúmenes reducen la **portabilidad práctica**, dado que pequeñas diferencias en la infraestructura pueden afectar el funcionamiento o requerir ajustes manuales.

- **Interoperabilidad y acoplamiento tecnológico:**  
  El uso de protocolos y herramientas estandarizadas (UDP, HTTP, Grafana, StatsD) favorece la **interoperabilidad** del sistema, tanto entre sus propios componentes como con futuras herramientas externas de monitoreo.  


### 3.1.2 Impactos del modelo de persistencia elegido
El modelo implementado para la persistencia del sistema consiste en guardar el estado de los datos que deben persistir en memoria y posteriormente cada tantos segundos se guarda dicho estado de la memoria en distintos archivos json en la carpeta ~state/~, es decir, en la memoria local de la instancia del servidor.
Es por esto mismo que, en principio, la sistema es _stateful_ lo cual acarrea varios problemas bien conocidos como lo son:

- Acomplamiento con el sevridor: Sesiones de usuarios se ven vinculadas directamente a la única instancia del sevridor, lo cual hace que no se pueda escalar horizontalmente la app sin perder el estado, ya que cada instancia tendria su propio estado en memoria y no habria forma sencilla de sincronizarlos pues requeriría alguna gestión de estado disribuido.

- Problemas de disponibilidad y degradación de performance percibida, pues el backend se vuelve un punto único de fallo, si este falla se pierden todas las sesiones activas y como no hay replicas que tengan la capacidad de retomar la sesión con el usuario enotnces la experiencia del usuario (user perceived performance) se ve degradada.


Además, como la memoria persistente está atada a la instancia del backend, y más aún se encuentra en su **file system**:

- Hay múltiples condiciones de carrera causadas por el nulo manejo de lectura/escritura concurrente del file system que no está diseñado para estos contextos, por lo que ni siquiera la misma instancia de backend en express.js puede usar correcatemente el modelo de concurrencia asincrónico. 

- Además, como el modelo de persistenia adoptado tampoco da soporte a algún tipo de transacciones, no solo hay condiciones carrera y errores por la lectura y esctitura concurrente de los mismos archivos, sino que tanmbién las operaciones incompletas no pueden deshacerse ni repetirse de forma segura. Frente a fallos, el sistema requiere procesos de recuperación manual o la restauración de copias de seguridad, en consecuencia, se degrada la **Disponibilidad** del sistema.

- La falta de atomicidad en las transacciones (no soportada por el file system) causa que se intercalen operaciones y validaciones que dejan al sistema en un estado invalido, es decir, no se garantizan las invariantes requeridas del sistema (ej. cantidad conswtante de dinero en las cuentas), afectando directamente a la **Integridad** del sistema.

También, a consecuencia del modelo de persistencia adoptado, que como mencionamos antes causa que el sistema no pueda incorporar réplicas del backend:

- La existencia de un balanceador de cargas se vuelve una decisión completamente cuestionable, pues no solo **no** existen replicas de backend entre las cuales distribuir la carga, sino, no existe la posibilidad de agregar de manera sencilla más instancias y además con esta compoennte adicional en medio de la comunicación entre el unico backend y el usuario se degrada el performance por el uso innecesario de la red que tiene tiempos de demora considerablemente altos en contraste con la computación local. 

### 3.1.3 INstancias únicas de cada servicio
múltiples puntos únicos de falla y carente de mecanismos de recuperación automática, lo cual implica que la falla de un solo servicio (API, Nginx, almacenamiento local) ocasionaría la indisponibilidad total del sistema.

### 3.1.4 Aesencia de patrón de arquitectura interna
Dificulta agregar alguna otra funcionalidad (extensibilidad) ni modificar facilmente funcionalidades presentes (modificabilidad) ya que la arquitectura monolítica no permite la separación clara de responsabilidades ni interfaces desacopladas, lo cual extiende y dificulta para el desarrollador llevar a cbao cambios.


---
# Legacy


- Performance
- Visibilidad
- Seguridad (aun no mencionda)
- Testabilidad 
- Portabilidad
- Interoperabilidad
- Usabilidad
- Manejabilidad
- Confiabilidad
- Simplicidad
- Modificabilidad




