const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { data, token } = JSON.parse(event.body);
    if (!data || !Array.isArray(data)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Datos requeridos y deben ser un array' }),
      };
    }
    for (const item of data) {
      if (!item.cliente || !item.fecha || !Array.isArray(item.tramos)) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Cada registro debe tener cliente, fecha y tramos' }),
        };
      }
    }
    const githubToken = process.env.GITHUB_TOKEN || token;
    const repo = process.env.GITHUB_REPO || 'FABIOR1981/controlHorasClientes';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const filePath = 'data/horasClientes.json';
    if (!githubToken) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Token de GitHub no configurado' }),
      };
    }
    const fileUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
    const fileResponse = await fetch(fileUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!fileResponse.ok) {
      const error = await fileResponse.text();
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Error al obtener el archivo de GitHub', details: error }),
      };
    }
    const fileData = await fileResponse.json();
    const currentSha = fileData.sha;
    const newContent = JSON.stringify(data, null, 2);
    const encodedContent = Buffer.from(newContent).toString('base64');
    const updateResponse = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Actualización de horas realizada.',
        content: encodedContent,
        sha: currentSha,
        branch: branch,
      }),
    });
    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Error al actualizar el archivo en GitHub', details: error }),
      };
    }
    const updateResult = await updateResponse.json();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, message: 'Archivo horasClientes.json actualizado en GitHub', commit: updateResult.commit.sha }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
    };
  }
};
