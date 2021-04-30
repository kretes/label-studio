import { useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '../../../components';
import { Description } from '../../../components/Description/Description';
import { Divider } from '../../../components/Divider/Divider';
import { ErrorWrapper } from '../../../components/Error/Error';
import { InlineError } from '../../../components/Error/InlineError';
import { Form, Input, Label, TextArea, Toggle } from '../../../components/Form';
import { modal } from '../../../components/Modal/Modal';
import { useAPI } from '../../../providers/ApiProvider';
import { ProjectContext } from '../../../providers/ProjectProvider';
import { MachineLearningList } from './MachineLearningList';
import './MachineLearningSettings.styl';

export const MachineLearningSettings = () => {
  const api = useAPI();
  const {project, fetchProject} = useContext(ProjectContext);
  const [mlError, setMLError] = useState();
  const [backends, setBackends] = useState([]);

  const fetchBackends = useCallback(async () => {
    const models = await api.callApi('mlBackends', {
      params: {
        project: project.id,
      },
    });

    if (models) setBackends(models);
  }, [api, project, setBackends]);

  const showMLFormModal = useCallback((backend) => {
    const action = backend ? "updateMLBackend" : "addMLBackend";
    const modalProps = {
      title: `${backend ? 'Edit' : 'Add'} model`,
      style: { width: 760 },
      closeOnClickOutside: false,
      body: (
        <Form
          action={action}
          formData={{ ...(backend ?? {}) }}
          params={{ pk: backend?.id }}
          onSubmit={async (response) => {
            if (!response.error_message) {
              await fetchBackends();
              modalRef.close();
            }
          }}
        >
          <Input type="hidden" name="project" value={project.id}/>

          <Form.Row columnCount={2}>
            <Input name="title" label="Title" placeholder="ML Model"/>
            <Input name="url" label="URL" required/>
          </Form.Row>

          <Form.Row columnCount={1}>
            <TextArea name="description" label="Description" style={{minHeight: 120}}/>
          </Form.Row>

          <Form.Actions>
            <Button type="submit" look="primary" onClick={() => setMLError(null)}>
              Validate and Save
            </Button>
          </Form.Actions>

          <Form.ResponseParser>{response => (
            <>
              {response.error_message && (
                <ErrorWrapper error={{
                  response: {
                    detail: `Failed to ${backend ? 'save' : 'add new'} ML backend.`,
                    exc_info: response.error_message,
                  },
                }}/>
              )}
            </>
          )}</Form.ResponseParser>

          <InlineError/>
        </Form>
      ),
    };

    const modalRef = modal(modalProps);
  }, [project, fetchBackends, mlError]);

  useEffect(() => {
    if (project.id) fetchBackends();
  }, [project]);

  return (
    <>
      <Description style={{marginTop: 0, maxWidth: 680}}>
        Add one or more machine learning models to predict labels for your data.
        To import predictions without connecting a model,
        {" "}
        <a href="https://labelstud.io/guide/predictions.html" target="_blank">
          see the documentation
        </a>.
      </Description>
      <Button onClick={() => showMLFormModal()}>
        Add Model
      </Button>

      <Divider height={32}/>

      <Form action="updateProject"
        formData={{...project}}
        params={{pk: project.id}}
        onSubmit={() => fetchProject()}
        autosubmit
      >
        <Form.Row columnCount={1}>
          <Label text="ML-Assisted Labeling" large/>

          <div style={{paddingLeft: 16}}>
            <p>Minimum number of annotated tasks after which model training is started, enter 0 to disable</p>
            <Input type="number" name="min_annotations_to_start_training" min="0" style={{ width: "100px" }}/>
          </div>

          <div style={{paddingLeft: 16}}>
            <Toggle
              label="Retrieve and display predictions when loading a task"
              name="evaluate_predictions_automatically"
            />
          </div>
        </Form.Row>
      </Form>

      <MachineLearningList
        onEdit={(backend) => showMLFormModal(backend)}
        fetchBackends={fetchBackends}
        backends={backends}
      />
    </>
  );
};

MachineLearningSettings.title = "Machine Learning";
MachineLearningSettings.path = "/ml";
