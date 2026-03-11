const selIndex = 14;

let actionBtn;
let incidentTable;
let incidentChoices = [];
let newIntegration = true;

function onLoad() {
    setCurrentStates();
    createSelectAll();
    // setupUserSelection();
}

function checkSubmitable() {

    checkedRows = incidentTable.$('.jr-checkbox:checked');
    
    incidentChoices = [];
    
    let sum = 0;
    
    checkedRows.each( (index,item, c) => {
        
        /* const userSelection = item.parentNode.parentNode.querySelector('td:last-child > select').value;
        if (userSelection && userSelection !== '-')
            incidentChoices.push([item.getAttribute('data-incident'), item.getAttribute('data-psi'), userSelection]);*/

            

            const rowVal = Number(localSeparatorReformat(item.parentNode.parentNode.querySelector('td:nth-child(6)').textContent));
            
            
            if (isNaN(rowVal)) return;

            incidentChoices.push([item.getAttribute('data-incident'), item.getAttribute('data-psi')]);

            sum += rowVal;

    });
    
    jr_set_value('selected_sum', sum);

    jr_set_disabled('button_action', incidentChoices.length === 0);
    
    const titles = [];
    incidentChoices.forEach(i => {
        titles.push(i[0]);
    });
    
    document.getElementById('button_action_label2').setAttribute('title', titles.join(', '));
    
    
}

function localSeparatorReformat(val) {
    let r = val.replaceAll($JRSETTINGS.thousandsSeparator, '');
    if ($JRSETTINGS.decimalSeparator !== '.') r = r.replace($JRSETTINGS.decimalSeparator, '.');
    return r;
}

function createSelectAll() {
    const inp = document.createElement('input');
    inp.setAttribute('type', 'checkbox');
    inp.classList.add('jr-checkbox');
    inp.id = 'ssChoiceSelectAll';
    const lab = document.createElement('label');
    lab.classList.add('ss-selectAll');
    lab.setAttribute('for', inp.id);
    
    
    inp.addEventListener('click', selectAllClickHandler);
    
    const container = document.querySelector('#incidentlist table thead tr th:first-child');
    container.classList.remove('jr-box-sortable-header-color', 'sorting');
    container.textContent = '';
    container.append(inp, lab);
    
}

function setCurrentStates() {
    // hideRightIntegration();

    actionBtn = document.getElementById('button_action');
    actionBtn.classList.add('jr-btn-success');
    
    const f = document.querySelector('#div_button_action > td:first-child'),
          s = document.querySelector('#div_button_action > td:nth-child(2)');

    s.setAttribute('colspan', '2');
    f.remove();
    
    incidentTable = $j('#incidentlist table').DataTable();
    
    checkSubmitable();

}

function onTableCheckClick(e) {
    /*const checkedRows = incidentTable.$('.jr-checkbox:checked');
    incidentChoices = [];
    checkedRows.each( (index, item) => {
        incidentChoices.push([item.getAttribute('data-incident'), item.getAttribute('data-psi')]);
    });*/
    
    checkSubmitable();
    
}

function simplyShowDocument(event) {
    
    if (newIntegration) {
        showRightIntegration();
        newIntegration = false;
    }
    
    const selDocId = event.currentTarget.getAttribute('data-dwdocid'),
          fc='4f18fd5b-bdde-451c-a7a4-460abdda1f3b',
          targetURI = `https://docuware.bremerbau.local:443/Docuware/Platform/WebClient/SSO/BREMER%20AG/Integration?p=V&fc=${fc}&did=${selDocId}`;
    
    document.getElementById('integration_right_iframe').setAttribute('src', targetURI);
    
    //jr_set_value('dwdocid',event.currentTarget.getAttribute('data-dwdocid'));
    // document.getElementById('showDocument').dispatchEvent(new Event('click'));
    
}

function simplySelectAssignee(e) {
    const selectedRow = e.currentTarget.parentNode.parentNode,
          assignee = e.currentTarget.value,
          buyerName = selectedRow.querySelector('td:nth-child(3)').textContent,
          costCenter = selectedRow.querySelector('td:nth-child(4)').textContent;
    
    if (jr_get_value('check_usecombination')) {
        incidentTable.rows().every( function(){
            const rowData = this.data();
            if (rowData[2] === buyerName && rowData[3] === costCenter) {
                this.node().querySelector('select').value = assignee;
            }
        });
    }

    checkSubmitable();

}

function selectAllClickHandler(e) {
    const check = document.getElementById('ssChoiceSelectAll'),
          condition = check.checked;
    
    incidentTable.rows({ search:'applied' }).every( function() {
        this.node().querySelector('.jr-checkbox').checked = condition;
    });
    
    onTableCheckClick();
}

function setupUserSelection() {
    const tData = incidentTable.data(),
          keys = [];
    for(i = 0; i<tData.length; i++) {
        const q = tData[i][selIndex].match(/data-param=\"([^\"]*)\"/)[1];
        if (!keys.includes(q)) keys.push(q);
    }
    if (keys.length === 0) return;
    ssQuietAsync('getApprovalUsersList', {keys}, createUserSelection);
}


function createUserSelection(r) {
    const userMap = r.result.users;
    
    incidentTable.rows().every( function(){
        const temp = document.createElement('div');
        const d = this.data();
        temp.innerHTML = d[selIndex];
        
        const container = temp.querySelector('select'),
              key = container.getAttribute('data-param');
            
        userMap[key].forEach( i => {
            const o = document.createElement('option');
            o.setAttribute('value',i[1]);
            o.textContent = i[0];
            container.append(o);
        });
        
        d[selIndex] = temp.innerHTML; 
        
        this.invalidate().draw();
        
    });
    
    // incidentTable.draw();
}


function updateIncidents() {
    ssQuietAsync('execBulkAction', {incidentChoices}, updateComplete);
}

function updateComplete(r) {
    
    const data = JSON.parse(r.result.q);
    
    console.log('updateComplete', data);
}

function buildAjaxRequestBody() {
    return {
        'workflowid': jr_get_value('workflowid'),
        'jr_simulation': jr_get_value('jr_simulation'),
        'dialogValues': {
            'processid': jr_get_value('processid'),
            'workflowid': jr_get_value('workflowid'),
            'csrf_token': jr_get_value('csrf_token'),
            'dialog': jr_get_value('dialog'),
            'processname': jr_get_value('processname'),
            'tablename': jr_get_value('tablename'),
            'jr_simulation': jr_get_value('jr_simulation'),
            'jr_new_step': jr_get_value('jr_new_step'),
            'step': jr_get_value('step'),
            'jr_mode': jr_get_value('jr_mode'),
            'version': jr_get_value('version'),
            'backlink': jr_get_value('backlink')
        }
    }
}

function ssQuietAsync(functionId, params, successFunc, errorFunc = e => { console.error(e); } ){
    
    const requestBody = buildAjaxRequestBody();
    requestBody.functionId = functionId;
    requestBody.userParameters = params;
    
    jQuery.ajax({
        method: 'POST',
        headers: {
            Accept: 'application/json, text/javascript, */*;'
        },
        dataType: 'json',
        url: './index.php?cmd=Ajax_ExecutePHPFunction',
        data: requestBody
    })
    .done(successFunc)
    .fail(errorFunc);
    
   
}