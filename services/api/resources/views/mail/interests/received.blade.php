@extends('layouts.interests-mail')

@section('content')
<h2 class="main-heading">New Interest Received — {{ $data->name }} wants to connect!</h2>

<div class="content">
    <p>Hi Team,</p>

    <p class="paragraph">We've received a new interest from {{ $data->name }}! ✨</p>

    <div class="interest-details">
        <div class="detail-item">
            <span class="detail-label">Name:</span> {{ $data->name }}
        </div>
        <div class="detail-item">
            <span class="detail-label">Email:</span> {{ $data->email }}
        </div>
        <div class="detail-item">
            <span class="detail-label">Company:</span> {{ $data->company_name }}
        </div>
        <div class="detail-item">
            <span class="detail-label">Company Size:</span> {{ $data->company_size }}
        </div>
        @if(isset($data->looking_for) && $data->looking_for)
        <div class="detail-item">
            <span class="detail-label">Details:</span> {{ $data->looking_for }}
        </div>
        @endif
    </div>

    <p class="paragraph">Please follow up with {{ $data->name }} to discuss their interest and next steps.</p>

    <p class="paragraph">Let's make this connection count!</p>

    <p>— Zunou Team</p>
</div>
@endsection