var SUPABASE_URL = 'https://isqlqmhueoiwnlcsvsfg.supabase.co';
var SUPABASE_KEY = 'sb_publishable_hPu0RIbvCd_DBCM4s2lH2g_U6CONZdr';

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
        var url = query ? baseUrl + '?' + query : baseUrl;
        var res = await fetch(url, { method: 'GET', headers: baseHeaders });
        if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (await res.text()));
        return await res.json();
      },

      insert: async function(data) {
        var payload = Array.isArray(data) ? data : [data];
        var res = await fetch(baseUrl, {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (await res.text()));
        return await res.json();
      },

      update: async function(data, matchCol, matchVal) {
        var url = baseUrl + '?' + matchCol + '=eq.' + encodeURIComponent(matchVal);
        var res = await fetch(url, {
          method: 'PATCH',
          headers: baseHeaders,
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (await res.text()));
        return await res.json();
      },

      delete: async function(matchCol, matchVal) {
        var url = baseUrl + '?' + matchCol + '=eq.' + encodeURIComponent(matchVal);
        var res = await fetch(url, { method: 'DELETE', headers: baseHeaders });
        if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (await res.text()));
        return res.status === 204 ? [] : await res.json();
      }
    };
  }
};
