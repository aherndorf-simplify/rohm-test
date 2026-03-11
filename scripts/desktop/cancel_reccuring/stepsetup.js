function onLoad() {
    init();
    setLocalEvents();
    
    // stSetup();
    
    
}


function stSetup() {
    
    let data = {0: {sid: '', pid: ''}};
    jr_subtable_init('test123', data, stv =>  {
        setTimeout(stSettings, 1000);
    }, (subtableViewName, errorMessage) => {
        console.error(errorMessage);
    });

}

function stSettings(){
    const cond = true;
    
    if (cond) {
        jr_hide_subtable_column('test', 'pid');
    }
    
}

function onSubmit() {
    
}

function setLocalEvents() {
    document.querySelectorAll('#open_recurring_invoices table > tbody button').forEach( i => {
       i.addEventListener('click', tableButtonClickEvent); 
    });
    
    
    document.getElementById('testest').addEventListener('click', (e) => {
        e.target.parentNode.querySelector('button').dispatchEvent(new Event('click'));
    });
    
    
}

function tableButtonClickEvent() {
    const sid = this.getAttribute('data-sid'),
          archiveId = this.getAttribute('data-archiveid');
          
    if (archiveId) triggerShowDocument(archiveId);
    if (sid) triggetCancelResubmission(sid);
    
          
}

function triggerShowDocument(archiveId) {
    jr_set_value('doc_param', archiveId);
    document.getElementById('doc_show').dispatchEvent(new Event('click'));
}


function triggetCancelResubmission(stepId) {
    ssQuietAsync('cancelRecurringInvoices', { stepId }, s => {
        jr_sql_refresh('open_recurring_invoices');
    });
}
