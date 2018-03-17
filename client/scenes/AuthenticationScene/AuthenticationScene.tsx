import { h, Component } from 'preact';
import InputText from '../../components/InputText';
import InputPassword from '../../components/InputPassword';
import ButtonText from '../../components/ButtonText';
import ServicesInterface from '../services/interface';
import './AuthenticationScene.scss';
import * as strings from '../../strings.json';

interface PropTypes {
  services: ServicesInterface;
}

interface StateTypes {
  validationErrors: Array<string>;
}

export default class AuthenticationScene extends Component<PropTypes, StateTypes> {
  private action: string = 'login';
  private email: string = '';
  private password: string = '';

  constructor(props: PropTypes) {
    super(props);
    this.state = {
      validationErrors: [],
    }
  }

  handleAuthenticate(event) {
    event.preventDefault();
    const {
      authService,
    } = this.props.services

    const email = this.email;
    const password = this.password;

    switch(this.action) {
      case 'login':
        authService.login(email, password)
          .catch((data) => {
            this.setState({ validationErrors: data.validationErrors })
          })
          break;

      case 'register':
        authService.register(email, password)
          .catch((data) => {
            this.setState({ validationErrors: data.validationErrors })
          })
        break;
    }
  }

  render() {
    const {
      validationErrors,
    } = this.state;
    return (
      <div className="AuthenticationScene">
        <form onSubmit={this.handleAuthenticate.bind(this)}
          className="AuthenticationScene-form"
          autocomplete="on">
          <InputText name="email"
            type="email"
            label="Email Address"
            placeholder="john.doe@example.com"
            autocomplete="email"
            onInput={({ target }) => {this.email = target.value}}
            required />
          <InputPassword name="password"
            label="Password"
            placeholder="••••••••"
            autocomplete="password"
            onInput={({ target }) => {this.password = target.value}}
            required />
          <div className="AuthenticationScene-form-buttons">
            <ButtonText type="submit"
              value="Login"
              onClick={() => { this.action = 'login' }} />
            <ButtonText type="submit"
              value="Register"
              onClick={() => { this.action = 'register' }}/>
          </div>
          <div style={{ width: '100%' }}>
            {validationErrors.map((error) => (
              <p className="AuthenticationScene-form-errors">
                {strings[error]}
              </p>
            ))}
          </div>
        </form>
      </div>
    )
  }
}
