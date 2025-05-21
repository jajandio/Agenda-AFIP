# Agenda-AFIP

Un **userscript** para Tampermonkey que añade una pequeña agenda de receptores en la pantalla **RCEL – Factura C (Datos del Receptor, Paso 2)** de AFIP.  

- Guarda localmente **CUIT**, **Razón Social** y **Domicilio** junto con un **alias** definido por el usuario.  
- Permite recuperar al instante los datos de un contacto guardado con solo seleccionar su alias.  
- Dispara automáticamente los eventos necesarios para que AFIP rellene el resto de campos.

---

## 📦 Instalación

1. **Instala Tampermonkey** en tu navegador (Chrome, Edge, Firefox…):  
   https://www.tampermonkey.net/

2. **Añade el userscript** a Tampermonkey:  
   - Abre este enlace en tu navegador:  
     https://raw.githubusercontent.com/jajandio/Agenda-AFIP/main/agenda-afip.user.js  
   - Tampermonkey detectará automáticamente el userscript y te ofrecerá la opción de **Instalar**.  
   - Confirma la instalación y activa el script.

---

## 🚀 Uso

1. En la página de AFIP, introduce un CUIT y espera a que AFIP rellene Razón Social y Domicilio.  
2. Pulsa **Guardar contacto**, asigna un alias descriptivo.  
3. La próxima vez, elige ese alias en el desplegable **Contacto guardado**.  
4. El CUIT se vuelca solo y AFIP recupera el resto de datos.

---

## 🤝 Contribuciones

¡Todas las contribuciones son bienvenidas!  
1. Haz un **fork** de este repositorio.  
2. Crea una rama con tu mejora (`git checkout -b feature/nueva-funcionalidad`).  
3. Haz **commit** de tus cambios y haz **push**.  
4. Abre un **Pull Request** describiendo tu aporte.

---

## 📄 Licencia

Este proyecto está bajo licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
