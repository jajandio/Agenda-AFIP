// ==UserScript==
// @name         AFIP RCEL - Agenda de CUITs
// @namespace    https://github.com/jajandio/Agenda-AFIP
// @version      0.4
// @description  Guarda, recupera y gestiona contactos (CUIT + datos) en RCEL – Factura C (Datos del Receptor, Paso 2) de AFIP, con los botones de acción en una línea separada bajo el selector.
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

  /* ——— Almacenamiento ——— */
  const KEY = 'afipAgendaReceptores';
  const getAgenda = () => GM_getValue(KEY, {});
  const saveAgenda = a => GM_setValue(KEY, a);

  /* ——— Referencias DOM ——— */
  const inputCUIT  = document.querySelector('#nrodocreceptor');
  const inputRazon = document.querySelector('#razonsocialreceptor');
  const comboDom   = document.querySelector('#domicilioreceptorcombo');

  /* ——— Crear elementos UI ——— */
  const selectAgenda = document.createElement('select');
  selectAgenda.id = 'agendaReceptores';
  selectAgenda.className = 'jig_readonly';
  selectAgenda.style.width = '350px';

  const btnSave = document.createElement('button');
  btnSave.textContent = 'Guardar contacto';
  btnSave.type = 'button';

  const btnAdmin = document.createElement('button');
  btnAdmin.textContent = 'Administrar agenda';
  btnAdmin.type = 'button';

  // Contenedor principal en columna
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.gap = '6px';

  // Línea de selector
  wrapper.appendChild(selectAgenda);

  // Fila de botones, una sola línea
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '8px';
  btnRow.appendChild(btnSave);
  btnRow.appendChild(btnAdmin);
  wrapper.appendChild(btnRow);

  /* ——— Insertar en tabla AFIP ——— */
  const filaCUIT = inputCUIT.closest('tr');
  const nuevaFila = document.createElement('tr');
  nuevaFila.innerHTML = `<th>Contacto guardado</th><td></td>`;
  nuevaFila.querySelector('td').appendChild(wrapper);
  filaCUIT.parentNode.insertBefore(nuevaFila, filaCUIT);

  /* ——— Refrescar el <select> con la agenda ——— */
  function refreshSelect() {
    const agenda = getAgenda();
    selectAgenda.innerHTML =
      '<option value="">— Seleccionar contacto guardado —</option>';
    Object.values(agenda)
      .sort((a, b) => a.alias.localeCompare(b.alias))
      .forEach(({ cuit, alias }) => {
        const o = document.createElement('option');
        o.value = cuit;
        o.textContent = `${alias} (${cuit})`;
        selectAgenda.appendChild(o);
      });
  }
  refreshSelect();

  /* ——— Al seleccionar un contacto ——— */
  selectAgenda.addEventListener('change', () => {
    const cuit = selectAgenda.value;
    if (!cuit) return;
    inputCUIT.value = cuit;
    inputCUIT.dispatchEvent(new Event('change', { bubbles: true }));
    inputCUIT.dispatchEvent(
      new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', bubbles: true })
    );
    selectAgenda.selectedIndex = 0;
  });

  /* ——— Guardar nuevo contacto ——— */
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
    alert(`Contacto “${alias}” guardado.`);
  });

  /* ——— Modal de administración ——— */
  // Estilos mínimos
  const style = document.createElement('style');
  style.textContent = `
#afipAgendaOverlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
#afipAgendaModal {
  background: white; padding: 20px; border-radius: 6px;
  max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
}
#afipAgendaModal h3 { margin-top: 0; font-size: 18px; }
#afipAgendaModal table { width: 100%; border-collapse: collapse; }
#afipAgendaModal th, #afipAgendaModal td {
  padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px;
}
#afipAgendaModal th { background: #f5f5f5; text-align: left; }
.afipAgendaBtn { cursor: pointer; border: none; background: none; }
.afipAgendaBtn.del { color: #d00; }
#afipAgendaClose { float: right; font-size: 16px; }
`;
  document.head.appendChild(style);

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

    const title = document.createElement('h3');
    title.textContent = 'Administrar Agenda de CUITs';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Alias</th><th>CUIT</th><th>Razón social</th><th></th></tr>`;
    const tbody = document.createElement('tbody');

    function render() {
      tbody.innerHTML = '';
      const items = Object.values(getAgenda()).sort((a, b) =>
        a.alias.localeCompare(b.alias)
      );
      if (items.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          `<td colspan="4" style="text-align:center;color:#666;">(sin contactos guardados)</td>`;
        tbody.append(tr);
        return;
      }
      for (const { alias, cuit, razon } of items) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${alias}</td>
          <td>${cuit}</td>
          <td>${razon || ''}</td>
          <td style="text-align:center;">
            <button class="afipAgendaBtn del" title="Borrar">🗑️</button>
          </td>
        `;
        tr.querySelector('.del').onclick = () => {
          if (confirm(`¿Borrar contacto “${alias}” (${cuit})?`)) {
            const ag = getAgenda();
            delete ag[cuit];
            saveAgenda(ag);
            refreshSelect();
            render();
          }
        };
        tbody.append(tr);
      }
    }
    render();

    table.append(thead, tbody);
    modal.append(closeBtn, title, table);
    overlay.append(modal);
    return overlay;
  }

  btnAdmin.addEventListener('click', () => {
    document.body.appendChild(buildModal());
  });

})();
