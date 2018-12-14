const { google } = require('googleapis');
const CLIENT_SERVICE_MAP = new Map();

function loadCredentialsToken (config) {
    const credentialsFilepath = `${__dirname}/../../config/${config.credentialsRelativeFilepath}`;
    const tokenFilepath = `${__dirname}/../../config/${config.rwTokenRelativeFilepath ? config.rwTokenRelativeFilepath : config.roTokenRelativeFilepath}`;
    const result = {};
    try {
        result.credentials = require(credentialsFilepath);
    } catch(err) {
        throw new Error(`Failed to load Credentials JSON: ${credentialsFilepath}. ${err}`);
    }
    try {
        result.token = require(tokenFilepath);
    } catch(err) {
        throw new Error(`Failed to load Token JSON: ${tokenFilepath}. ${err}`);
    }
    return result;
}

function getClientService (identifier, config) {
    const { credentials, token } = loadCredentialsToken(config);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const clientKey = identifier;
    let clientService = CLIENT_SERVICE_MAP.get(clientKey);
    if (!clientService) {
        const client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);
        client.setCredentials(token);
        const service = google.tasks({version: 'v1', auth: client });
        clientService = { client, service };
        CLIENT_SERVICE_MAP.set(clientKey,clientService);
    }
    return clientService;
}

function fetchTasks (identifier, config, successCallback, failureCallback) {
    let clientService = null;
    try {
        clientService = getClientService(identifier, config);
    } catch (err) {
        failureCallback(`Failed to acquire authorized client. Reset token, or client credentials. ${err}`);
        return;
    }
    if (!config.listID || !config.listName) {
        // resolve id -> name or Name -> id
        clientService.service.tasklists.list({
            maxResults: 100,
          }, (err, res) => {
            
            if (err) {
                failureCallback(`The tasklists.list API returned an error: ${err}`);
                return;
            }
            const taskLists = res.data.items;
            if (taskLists && taskLists.length > 0) {
                taskLists.forEach((taskList) => {
                    if (config.listID && taskList.id === config.listID) {
                        config.listName = taskList.title;
                    } else if (config.listName && taskList.title === config.listName) {
                        config.listID = taskList.id;
                    }
                });
                if (!config.listID || !config.listName) {
                    console.error(`Failed to find list ID or Name. Using 1st list`);
                    config.listID = taskLists[0].id;
                    config.listName = taskLists[0].title;
                }
                fetchTasks(identifier, config, successCallback, failureCallback);
            } else {
                failureCallback('No task lists found.');
            }
          });
    } else {
        // resolve id to list of tasks
        clientService.service.tasks.list({
            tasklist: config.listID,
            showCompleted: config.showCompleted,
            showHidden: config.showHidden,
        }, (err, res) => {
            if (err) {
                failureCallback(`The tasks.list (${config.listID}) API returned an error: ${err}`);
                return;
            }
            var payload = {config, tasks: res.data.items};
            successCallback(payload);
        });            
    }
}
function putTask(identifier, config, item, successCallback, failureCallback) {
    let clientService = null;
    try {
        clientService = getClientService(identifier, config);
    } catch (err) {
        failureCallback(`Failed to acquire authorized client. Reset token, or client credentials. ${err}`);
        return;
    }
    clientService.service.tasks.update({
        task: item.id,
        tasklist: config.listID,
        resource: item,
    }, (err, res) => {
        if (err) {
            failureCallback(`The tasks.update API call for '${item.title}'(${item.id}) in '${config.listName}'(${config.listID}) returned an error: ${err}, ${JSON.stringify(item)}`);
            return;
        }
        successCallback(`Successfully updated '${item.title}' in '${config.listName}'`);
    });
}
function deleteTask(identifier, config, item, successCallback, failureCallback) {
    let clientService = null;
    try {
        clientService = getClientService(identifier, config);
    } catch (err) {
        failureCallback(`Failed to acquire authorized client. Reset token, or client credentials. ${err}`);
        return;
    }
    clientService.service.tasks.delete({
        task: item.id,
        tasklist: config.listID,
    }, (err, res) => {
        if (err) {
            failureCallback(`The tasks.delete API call for '${item.title}'(${item.id}) from '${config.listName}'(${config.listID}) returned an error: ${err}, ${JSON.stringify(item)}`);
            return;
        }
        successCallback(`Successfully deleted '${item.title}' from '${config.listName}'`);
    });
}
module.exports = { fetchTasks, putTask, deleteTask };
