import * as React from 'react';
import {Field, useFormState} from 'react-final-form';

import {TextInput, CheckBox} from '@neos-project/react-ui-components';

import {ILinkOptions, ILinkType, useEditorState} from '../../domain';
import {Layout} from '../../presentation';
import {useI18n} from '@sitegeist/archaeopteryx-neos-bridge';

export const Settings: React.FC<{
    linkType: ILinkType
    enabledLinkOptions: (keyof ILinkOptions)[]
    initialValue?: {
        anchor?: string
        title?: string
        targetBlank?: boolean
        relNofollow?: boolean
    }
}> = props => {
    const i18n = useI18n();
    const {editorOptions} = useEditorState();
    const linkTypeOptions = editorOptions.linkTypes?.[props.linkType.id] as any ?? {};
    const {values} = useFormState({subscription: {values: true}});
    // Same key as the FieldGroup prefix of the link type's editor
    const linkTypeModel = values?.linkTypeProps?.[props.linkType.id.split('.').join('_')] ?? null;
    const AnchorEditor = props.linkType.AnchorEditor?.isEnabledFor(linkTypeOptions)
        ? props.linkType.AnchorEditor.Editor
        : null;

    return (
        <Layout.Stack>
            {props.enabledLinkOptions.includes('anchor') || props.enabledLinkOptions.includes('title') ? (
                <Layout.Columns>
                    {props.enabledLinkOptions.includes('anchor') ? (
                        <Field<string>
                            name="options.anchor"
                            initialValue={props.initialValue?.anchor}
                            >
                            {({input}) => AnchorEditor ? (
                                // No <label>: it would forward clicks inside the dropdown to its toggle
                                <div>
                                    {i18n('Sitegeist.Archaeopteryx:Main:options.label.anchor')}:
                                    <AnchorEditor
                                        model={linkTypeModel}
                                        options={linkTypeOptions}
                                        value={input.value || undefined}
                                        onChange={value => input.onChange(value ?? '')}
                                    />
                                </div>
                            ) : (
                                <label>
                                    {i18n('Sitegeist.Archaeopteryx:Main:options.label.anchor')}:
                                    <TextInput type="text" {...input}/>
                                </label>
                            )}
                        </Field>
                    ) : null}
                    {props.enabledLinkOptions.includes('title') ? (
                        <Field<string>
                            name="options.title"
                            initialValue={props.initialValue?.title}
                            >
                            {({input}) => (
                                <label>
                                    {i18n('Sitegeist.Archaeopteryx:Main:options.label.title')}:
                                    <TextInput type="text" {...input}/>
                                </label>
                            )}
                        </Field>
                    ) : null}
                </Layout.Columns>
            ) : null}
            {props.enabledLinkOptions.includes('targetBlank') || props.enabledLinkOptions.includes('relNofollow') ? (
                <Layout.Columns>
                    {props.enabledLinkOptions.includes('targetBlank') ? (
                        <Field<boolean>
                            type="checkbox"
                            name="options.targetBlank"
                            initialValue={Boolean(props.initialValue?.targetBlank)}
                            >
                            {({input}) => (
                                <label>
                                    <CheckBox onChange={input.onChange} isChecked={input.checked}/>
                                    {i18n('Sitegeist.Archaeopteryx:Main:options.label.targetBlank')}
                                </label>
                            )}
                        </Field>
                    ) : null}
                    {props.enabledLinkOptions.includes('relNofollow') ? (
                        <Field<boolean>
                            type="checkbox"
                            name="options.relNofollow"
                            initialValue={Boolean(props.initialValue?.relNofollow)}
                            >
                            {({input}) => (
                                <label>
                                    <CheckBox onChange={input.onChange} isChecked={input.checked}/>
                                    {i18n('Sitegeist.Archaeopteryx:Main:options.label.relNofollow')}
                                </label>
                            )}
                        </Field>
                    ) : null}
                </Layout.Columns>
            ) : null}
        </Layout.Stack>
    );
}
