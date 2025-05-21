// ==UserScript==
// @name         AFIP RCEL - Agenda de CUITs
// @namespace    https://github.com/jajandio/Agenda-AFIP
// @version      0.2
// @description  Guarda y recupera CUIT, Razón Social y Domicilio en la pantalla “Datos del Receptor (Paso 2)” de RCEL (Factura C) de AFIP.
// @author       Tú
// @match        https://*.afip.gob.ar/*genComDatosReceptor*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/jajandio/Agenda-AFIP/main/agenda-afip.user.js
// @downloadURL  https://raw.githubusercontent.com/jajandio/Agenda-AFIP/main/agenda-afip.user.js
// @homepageURL  https://github.com/jajandio/Agenda-AFIP
// ==/UserScript==

(function() {
  'use strict';

  // —————— Almacenamiento ——————
  const KEY = 'afipAgendaReceptores';
  function getAgenda() { return GM_getValue(KEY, {}); }
  function saveAgenda(agenda) { GM_setValue(KEY, agenda); }

  // —————— Campos de la página ——————
  const inputCUIT  = document.querySelector('#nrodocreceptor');
  const inputRazon = document.querySelector('#razonsocialreceptor');
  const comboDom   = document.querySelector('#domicilioreceptorcombo');

  // —————— UI: select + botón ——————
  const selectAgenda = document.createElement('select');
  selectAgenda.id = 'agendaReceptores';
  selectAgenda.className = 'jig_readonly';
  selectAgenda.style.width = '350px';
  selectAgenda.innerHTML = '<option value="">— Seleccionar contacto guardado —</option>';

  const btnSave = document.createElement('button');
  btnSave.textContent = 'Guardar contacto';
  btnSave.type = 'button';           // ¡Importante para que NO envíe el formulario!
  btnSave.style.marginLeft = '8px';

  const contenedor = document.createElement('div');
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'center';
  contenedor.appendChild(selectAgenda);
  contenedor.appendChild(btnSave);

  // —————— Insertar dentro de la tabla de AFIP ——————
  const filaCUIT = inputCUIT.closest('tr');
  const nuevaFila = document.createElement('tr');
  const th = document.createElement('th');
  th.textContent = 'Contacto guardado';
  const td = document.createElement('td');
  td.appendChild(contenedor);
  nuevaFila.appendChild(th);
  nuevaFila.appendChild(td);
  filaCUIT.parentNode.insertBefore(nuevaFila, filaCUIT);

  // —————— Recarga el select desde storage ——————
  function refreshSelect() {
    const agenda = getAgenda();
    selectAgenda.innerHTML = '<option value="">— Seleccionar contacto guardado —</option>';
    Object.values(agenda)
      .sort((a, b) => a.alias.localeCompare(b.alias))
      .forEach(({ cuit, alias }) => {
        const opt = document.createElement('option');
        opt.value = cuit;
        opt.textContent = `${alias} (${cuit})`;
        selectAgenda.appendChild(opt);
      });
  }
  refreshSelect();

  // —————— Al elegir un contacto ——————
  selectAgenda.addEventListener('change', function() {
    const cuit = this.value;
    if (!cuit) return;
    inputCUIT.value = cuit;
    inputCUIT.dispatchEvent(new Event('change', { bubbles: true }));
    inputCUIT.dispatchEvent(new KeyboardEvent('keypress', {
      key: 'Enter', code: 'Enter', bubbles: true
    }));
    this.selectedIndex = 0;
  });

  // —————— Al guardar un contacto ——————
  btnSave.addEventListener('click', function() {
    const cuit = inputCUIT.value.trim();
    const razon = inputRazon.value.trim();
    const domicilio = comboDom?.value || '';
    if (!cuit || cuit.length < 11) {
      alert('Primero completá un CUIT válido y esperá a que AFIP recupere los datos.');
      return;
    }
    const alias = prompt('Alias o nick para este receptor:', razon || cuit);
    if (!alias) return;
    const agenda = getAgenda();
    agenda[cuit] = { cuit, alias, razon, domicilio };
    saveAgenda(agenda);
    refreshSelect();
    alert(`Contacto “${alias}” guardado correctamente.`);
  });

})();
