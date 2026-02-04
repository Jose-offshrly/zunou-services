@extends('layouts.mail')

@section('content')
  <p>
    Hi {{ $userName }},
  </p>

  <p>
    We've received your request to delete your account associated with <strong>{{ $appName }}</strong>.
  </p>

  <h3>What happens next</h3>

  <ul>
    <li>Your account is scheduled for permanent deletion within 30 days from the date of this email.</li>
    <li>During this period, your data will be securely stored and not used for any active services.</li>
    <li>Once deletion is complete, your account and associated data cannot be recovered.</li>
  </ul>

  <h3>Important notes</h3>

  <ul>
    <li>If you change your mind, you may cancel this request by logging into your account within the next 30 days.</li>
    <li>After the deletion process is finalized, you will no longer be able to access your account, history, or any stored information.</li>
  </ul>

  <h3>Confirmation</h3>

  <p>
    You will receive a final confirmation email once your account has been fully deleted.
  </p>

  <p>
    If you have any questions or need assistance, please contact us at <a href="mailto:{{ $supportEmail }}">{{ $supportEmail }}</a>.
  </p>

  <p>
    Thank you for using {{ $appName }}.
  </p>

  <p>
    Best regards,<br>
    {{ $companyName }} Support Team
  </p>
@endsection
