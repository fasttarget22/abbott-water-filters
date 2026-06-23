async function testSupabase() {
  try {
    var url = 'https://isqlqmhueoiwnlcsvsfg.supabase.co/rest/v1/employees?select=*&limit=1';
    var res = await fetch(url, {
      headers: {
        'apikey': 'sb_publishable_hPu0RIbvCd_DBCM4s2lH2g_U6CONZdr',
        'Authorization': 'Bearer sb_publishable_hPu0RIbvCd_DBCM4s2lH2g_U6CONZdr'
      }
    });
    var text = await res.text();
    console.log('Supabase test status:', res.status);
    console.log('Supabase test response:', text);
  } catch(e) {
    console.log('Supabase test error:', e);
  }
}
testSupabase();

var SUPABASE_URL = 'https://isqlqmhueoiwnlcsvsfg.supabase.co';
var SUPABASE_KEY = 'sb_publishable_hPu0RIbvCd_DBCM4s2lH2g_U6CONZdr';

async function loadFilterModels(selectElementId, selectedValue) {
  var sel = document.getElementById(selectElementId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading…</option>';
  var models;
  try {
    models = await db.from('filter_models').select('select=*&active=eq.true&order=display_order.asc');
  } catch(e) {
    console.error('[loadFilterModels] error:', e);
    sel.innerHTML = '<option value="">Select model…</option>';
    return;
  }
  sel.innerHTML = '<option value="">Select model…</option>';
  models.forEach(function(m) {
    var opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = m.name;
    opt.setAttribute('data-default-life', m.default_life);
    if (selectedValue && m.name === selectedValue) opt.selected = true;
    sel.appendChild(opt);
  });
}

function onFilterModelChange(modelSelectId, lifespanInputId) {
  var sel = document.getElementById(modelSelectId);
  if (!sel) return;
  var opt = sel.options[sel.selectedIndex];
  if (opt && opt.getAttribute('data-default-life')) {
    var el = document.getElementById(lifespanInputId);
    if (el) el.value = opt.getAttribute('data-default-life');
  }
}

var db = {
  from: function(table) {
    var baseUrl = SUPABASE_URL + '/rest/v1/' + table;
    var baseHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    return {
      select: async function(query) {
        var url = query ? baseUrl + '?' + query : baseUrl + '?select=*';
        var res = await fetch(url, { method: 'GET', headers: baseHeaders });
        if (!res.ok) {
          var errText = await res.text();
          console.error('[Supabase] SELECT', table, res.status, errText);
          throw new Error('Supabase ' + res.status + ': ' + errText);
        }
        return await res.json();
      },

      insert: async function(data) {
        var body = JSON.stringify(data);
        console.log('[Supabase] INSERT', table, 'body:', body);
        var res = await fetch(baseUrl, {
          method: 'POST',
          headers: baseHeaders,
          body: body
        });
        if (!res.ok) {
          var errText = await res.text();
          console.error('[Supabase] INSERT error', table, res.status, errText, '| sent:', body);
          throw new Error('Supabase ' + res.status + ': ' + errText);
        }
        return await res.json();
      },

      update: async function(data, matchCol, matchVal) {
        var url = baseUrl + '?' + matchCol + '=eq.' + encodeURIComponent(matchVal);
        var body = JSON.stringify(data);
        console.log('[Supabase] UPDATE', table, url, 'body:', body);
        var res = await fetch(url, {
          method: 'PATCH',
          headers: baseHeaders,
          body: body
        });
        if (!res.ok) {
          var errText = await res.text();
          console.error('[Supabase] UPDATE error', table, res.status, errText, '| url:', url, '| sent:', body);
          throw new Error('Supabase ' + res.status + ': ' + errText);
        }
        return await res.json();
      },

      delete: async function(matchCol, matchVal) {
        var url = baseUrl + '?' + matchCol + '=eq.' + encodeURIComponent(matchVal);
        console.log('[Supabase] DELETE', table, url);
        var res = await fetch(url, { method: 'DELETE', headers: baseHeaders });
        if (!res.ok) {
          var errText = await res.text();
          console.error('[Supabase] DELETE error', table, res.status, errText, '| url:', url);
          throw new Error('Supabase ' + res.status + ': ' + errText);
        }
        return res.status === 204 ? [] : await res.json();
      }
    };
  }
};
