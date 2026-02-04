@extends('layouts.interests-mail')

@section('content')
<h2 class="main-heading">Thank you for your interest — we're excited to connect!</h2>

<div class="content">
    <p>Hi {{ $data->name }},</p>

    <p class="paragraph">We're thrilled you're interested in joining Zunou.ai! ✨</p>

    <p class="paragraph">Our team is preparing your onboarding details. Keep an eye on your inbox — we'll be sending you an invite soon so you can set up your account and get started.</p>

    <p class="paragraph">We're excited to have you with us!</p>

    <p>— Zunou Team</p>
</div>
@endsection