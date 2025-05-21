// ==UserScript==
// @name         AFIP RCEL - Agenda de CUITs
// @namespace    https://github.com/jajandio/Agenda-AFIP
// @version      0.3
// @description  Guarda, recupera y ahora también permite borrar contactos (CUIT + datos) en la pantalla “Datos del Receptor (Paso 2)” de RCEL (Factura C) de AFIP.
// @author       Tú
// @match        https://*.afip.gob.ar/*genComDatosReceptor*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/jajandio/Agenda-AFIP/main/agenda-afip.user.js
// @downloadURL  https://raw.githubusercontent.com/jajandio/Agenda-AFIP/main/agenda-afip.user.js
// @homepageURL  https://github.com/jajandio/Agenda-AFIP
// ==/UserScript==

(function () {
  'use strict';

  /* ---------- Almacenamiento ---------- */
  const KEY = 'afipAgendaReceptores';
  const getAgenda = () => GM_getValue(KEY, {});          // { cuit: {cuit, alias, razon, domicilio} }
  const saveAgenda = (a) => GM_setValue(KEY, a);

  /* ---------- Referencias en el DOM de AFIP ---------- */
  const inputCUIT   = document.querySelector('#nrodocreceptor');
  const inputRazon  = document.querySelector('#razonsocialreceptor');
  const comboDom    = document.querySelector('#domicilioreceptorcombo');

  /* ---------- UI principal (select + botones) ---------- */
  const selectAgenda = document.createElement('select');
  selectAgenda.id = 'agendaReceptores';
  selectAgenda.className = 'jig_readonly';
  selectAgenda.style.width = '350px';

  const btnSave = document.createElement('button');
  btnSave.textContent = 'Guardar contacto';
  btnSave.type = 'button';
  btnSave.style.marginLeft = '8px';

  const btnAdmin = document.createElement('button');
  btnAdmin.textContent = 'Administrar agenda';
  btnAdmin.type = 'button';
  btnAdmin.style.marginLeft = '8px';

  const contenedor = document.createElement('div');
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'center';
  contenedor.append(selectAgenda, btnSave, btnAdmin);

  /* ---------- Inserción en la tabla de AFIP ---------- */
  const filaCUIT = inputCUIT.closest('tr');
  const nuevaFila = document.createElement('tr');
  nuevaFila.innerHTML = `<th>Contacto guardado</th><td></td>`;
  nuevaFila.querySelector('td').appendChild(contenedor);
  filaCUIT.parentNode.insertBefore(nuevaFila, filaCUIT);

  /* ---------- Utilidades de UI ---------- */
  function refreshSelect() {
    const agenda = getAgenda();
    selectAgenda.innerHTML =
      '<option value="">— Seleccionar contacto guardado —</option>';
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

  /* ---------- Select: rellenar CUIT ---------- */
  selectAgenda.addEventListener('change', function () {
    const cuit = this.value;
    if (!cuit) return;
    inputCUIT.value = cuit;
    inputCUIT.dispatchEvent(new Event('change', { bubbles: true }));
    inputCUIT.dispatchEvent(
      new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', bubbles: true })
    );
    this.selectedIndex = 0;
  });

  /* ---------- Botón Guardar ---------- */
  btnSave.addEventListener('click', () => {
    const cuit = inputCUIT.value.trim();
    if (!cuit || cuit.length < 11) {
      alert('Primero completá un CUIT válido y esperá a que AFIP recupere los datos.');
      return;
    }
    const alias = prompt('Alias o nick para este receptor:', inputRazon.value.trim() || cuit);
    if (!alias) return;

    const agenda = getAgenda();
    agenda[cuit] = {
      cuit,
      alias,
      razon: inputRazon.value.trim(),
      domicilio: comboDom?.value || '',
    };
    saveAgenda(agenda);
    refreshSelect();
    alert(`Contacto “${alias}” guardado correctamente.`);
  });

  /* ---------- Modal de administración ---------- */
  // 1) Inyectamos estilos mínimos
  const style = document.createElement('style');
  style.textContent = `
#afipAgendaOverlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 9999; display: flex;
  justify-content: center; align-items: center; font-family: sans-serif;
}
#afipAgendaModal {
  background: #fff; padding: 20px 24px; border-radius: 6px; max-width: 600px; width: 90%;
  max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,.2);
}
#afipAgendaModal table { width: 100%; border-collapse: collapse; }
#afipAgendaModal th, #afipAgendaModal td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
#afipAgendaModal th { text-align: left; background: #f5f5f5; }
.afipAgendaBtn { cursor: pointer; border: none; background: none; font-size: 14px; }
.afipAgendaBtn.del { color: #d00; }
#afipAgendaClose { float: right; margin-left: 8px; }
`;
  document.head.appendChild(style);

  // 2) Generador del contenido del modal
  function buildModal() {
    const overlay = document.createElement('div');
    overlay.id = 'afipAgendaOverlay';

    const modal = document.createElement('div');
    modal.id = 'afipAgendaModal';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'afipAgendaClose';
    closeBtn.className = 'afipAgendaBtn';
    closeBtn.textContent = '✖';
    closeBtn.title = 'Cerrar';
    closeBtn.onclick = () => overlay.remove();

    const titulo = document.createElement('h3');
    titulo.textContent = 'Agenda de CUITs';
    titulo.style.margin = '0 0 12px 0';
    titulo.style.fontSize = '18px';

    const tabla = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Alias</th><th>CUIT</th><th>Razón social</th><th></th></tr>`;
    const tbody = document.createElement('tbody');

    function renderRows() {
      tbody.innerHTML = '';
      const agenda = getAgenda();
      const items = Object.values(agenda).sort((a, b) => a.alias.localeCompare(b.alias));
      if (!items.length) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" style="text-align:center;color:#666;">(Sin contactos guardados)</td>`;
        tbody.appendChild(row);
        return;
      }

      for (const { cuit, alias, razon } of items) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${alias}</td>
          <td>${cuit}</td>
          <td>${razon || ''}</td>
          <td style="text-align:center;"><button class="afipAgendaBtn del" title="Borrar">🗑️</button></td>
        `;
        tr.querySelector('.del').onclick = () => {
          if (confirm(`¿Borrar el contacto “${alias}” (${cuit})?`)) {
            const agenda = getAgenda();
            delete agenda[cuit];
            saveAgenda(agenda);
            refreshSelect();
            renderRows();
          }
        };
        tbody.appendChild(tr);
      }
    }
    renderRows();

    tabla.append(thead, tbody);
    modal.append(closeBtn, titulo, tabla);
    overlay.appendChild(modal);
    return overlay;
  }

  // 3) Botón Administrar
  btnAdmin.addEventListener('click', () => {
    document.body.appendChild(buildModal());
  });
})();
