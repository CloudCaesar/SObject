/*=========================================================
        Imports
=========================================================*/

import * as CONSTANTS from '../constants';
import * as DataHandler from './dataHandler';
import * as sfdc_core from '@salesforce/core';

/*=========================================================
        Exported Functions
=========================================================*/

export async function getSalesforceConnection(pUsernameOrAlias?: string) {
    //Grab default username if passed string is empty
    if(undefined === pUsernameOrAlias) {
        pUsernameOrAlias = await getDefaultUsernameOrAlias();
    }
    console.log('Username ', pUsernameOrAlias);
    
    //Grab via queue option so if multiple apex scripts are running, we only initialise
    //the service and related config once
    return await DataHandler.getLocalWithQueue<sfdc_core.Connection>(
        CONSTANTS.STORAGE_KEY_APEX_EXECUTE_SERVICE + pUsernameOrAlias,
        async () => {
            return getConnectionForUsername(pUsernameOrAlias);
        }
    );
} 

export async function getDefaultUsernameOrAlias() {
    //Grab config aggregator which contains the default username/alias
    let configAggregator = await sfdc_core.ConfigAggregator.create();
    //Reload data to remove cached data.
    await configAggregator.reload();
    console.log('Target Org Output', configAggregator.getPropertyValue('target-org'));
    
    //Return result.
    return JSON.stringify(configAggregator.getPropertyValue('target-org')).replace(/"/g, '');
}

export async function getListOfUsernames() {
    let info = await sfdc_core.StateAggregator.getInstance();
    return info.aliases.getAll() as Record<string, string>;
}

/*=========================================================
        Helper Functions
=========================================================*/

/**
 * Based on the Salesforce VSCode plugins, this is how they obtain an execute service
 * that allows apex scripts to be ran in the target org for the default username
 * @returns SFDC Execute Service for executing apex
 */
async function getConnectionForUsername(pUsernameOrAlias: string) {
    //In order to build an AuthInfo object, we need a username, not an alias
    //so this grabs it out of the alias map. Of course if it's simply a username to begin with
    //then we use that if we can't find the alias in the map
    let info = await sfdc_core.StateAggregator.getInstance();
    let defaultUsername = info.aliases.getUsername(pUsernameOrAlias) || pUsernameOrAlias;

    //Build a connection using the default username
    return await sfdc_core.Connection.create({
        authInfo: await sfdc_core.AuthInfo.create({
            username: defaultUsername
        })
    });
}