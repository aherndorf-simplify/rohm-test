<?php

class className extends JobRouter\Engine\Runtime\PhpFunction\DialogFunction
{
	public function execute($rowId = null) {
		$stepId = $this->getParameter('stepId');
		
		$this->updateTargetHead($stepId);
		$this->updateTargetStep($stepId);
		
		$this->setReturnValue('update', 'done');
	}
	
	
	private function updateTargetHead($stepId) {
	    $jobDB = $this->getJobDB();
        $sql = 'UPDATE IA_HEAD SET REC_INV_CANCELLED = 1, REC_INV_FLAG = 0 WHERE step_id = :stepId';
        $parameters = [ 'stepId' => $stepId ];
        $types = [ JobRouter\Common\Database\ConnectionInterface::TYPE_TEXT ];
       
        $jobDB->preparedExecute($sql, $parameters, $types);
	}
	
	private function updateTargetStep($stepId) {
	    $jobDB = $this->getJobDB();
        $sql = 'UPDATE JRINCIDENTS set step_status = 99, resubmission_date = NULL WHERE process_step_id = :stepId';
        $parameters = [ 'stepId' => $stepId ];
        $types = [ JobRouter\Common\Database\ConnectionInterface::TYPE_TEXT ];
    
        $jobDB->preparedExecute($sql, $parameters, $types);
	}
}
?>