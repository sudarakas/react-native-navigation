import { ComponentRegistry } from './ComponentRegistry';
import { Store } from './Store';
import { mock, instance, verify, anyFunction, when, anyString, anything } from 'ts-mockito';
import { ComponentWrapper } from './ComponentWrapper';
import { ComponentEventsObserver } from '../events/ComponentEventsObserver';
import { AppRegistryService } from '../adapters/AppRegistryService';
import * as React from 'react';
import { ComponentProvider } from 'react-native';

const DummyComponent = () => null;

class MyComponent extends React.Component<any, any> {
}

describe('ComponentRegistry', () => {
  let mockedStore: Store;
  let mockedComponentEventsObserver: ComponentEventsObserver;
  let mockedComponentWrapper: ComponentWrapper;
  let mockedAppRegistryService: AppRegistryService;
  let uut: ComponentRegistry;

  beforeEach(() => {
    mockedStore = mock(Store);
    mockedComponentEventsObserver = mock(ComponentEventsObserver);
    mockedComponentWrapper = mock(ComponentWrapper);
    mockedAppRegistryService = mock(AppRegistryService);

    uut = new ComponentRegistry(
      instance(mockedStore),
      instance(mockedComponentEventsObserver),
      instance(mockedComponentWrapper),
      instance(mockedAppRegistryService)
    );
  });

  it('registers component by componentName into AppRegistry', () => {
    uut.registerComponent('example.MyComponent.name', () => DummyComponent);
    verify(
      mockedAppRegistryService.registerComponent('example.MyComponent.name', anyFunction())
    ).called();
  });

  it('saves the wrapper component generator to the store', () => {
    uut.registerComponent('example.MyComponent.name', () => DummyComponent);
    verify(
      mockedStore.setComponentClassForName('example.MyComponent.name', anyFunction())
    ).called();
  });

  it('should not invoke generator', () => {
    const generator: ComponentProvider = jest.fn(() => DummyComponent);
    uut.registerComponent('example.MyComponent.name', generator);
    expect(generator).toHaveBeenCalledTimes(0);
  });

  it('should create ComponentWrapper only once', () => {
    jest.spyOn(uut, 'wrapComponent');
    let _store: Record<string, ComponentProvider> = {};
    when(mockedStore.hasRegisteredWrappedComponent(anyString())).thenCall(name => name in _store);
    when(mockedStore.getComponentClassForName(anyString())).thenCall(name => _store[name]);
    when(mockedStore.setComponentClassForName(anyString(), anything())).thenCall((name, component) => _store[name] = component);
    when(mockedComponentWrapper.wrap).thenReturn(() => MyComponent);

    const generator: ComponentProvider = () => DummyComponent;
    uut.registerComponent('example.MyComponent.name', generator);
    uut.registerComponent('example.MyComponent.name', generator);
    
    expect(uut.wrapComponent).toHaveBeenCalledTimes(1);
  });
});
